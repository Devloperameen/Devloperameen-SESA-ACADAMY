import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { getIO } from '../utils/socket.js';

interface StudyRoom {
    id: string;
    name: string;
    courseId: string;
    hostId: string;
    participants: {
        userId: string;
        userName: string;
        role: 'host' | 'participant';
        joinedAt: Date;
        isActive: boolean;
    }[];
    isActive: boolean;
    maxParticipants: number;
    settings: {
        allowScreenShare: boolean;
        allowChat: boolean;
        allowVoice: boolean;
        isPublic: boolean;
        requireApproval: boolean;
    };
    currentActivity: {
        type: 'discussion' | 'quiz' | 'presentation' | 'study' | 'break';
        startedAt: Date;
        data?: any;
    };
    createdAt: Date;
}

interface WhiteboardState {
    roomId: string;
    elements: {
        id: string;
        type: 'line' | 'rectangle' | 'circle' | 'text' | 'arrow';
        x: number;
        y: number;
        width?: number;
        height?: number;
        points?: number[];
        text?: string;
        color: string;
        strokeWidth: number;
        userId: string;
        timestamp: Date;
    }[];
    lastModified: Date;
}

// In-memory storage (use Redis in production)
const activeRooms = new Map<string, StudyRoom>();
const whiteboards = new Map<string, WhiteboardState>();
const roomMessages = new Map<string, any[]>();

export const createStudyRoom = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            courseId,
            maxParticipants = 10,
            settings = {
                allowScreenShare: true,
                allowChat: true,
                allowVoice: true,
                isPublic: true,
                requireApproval: false
            }
        } = req.body;
        
        const userId = req.user?.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const studyRoom: StudyRoom = {
            id: roomId,
            name,
            courseId,
            hostId: userId,
            participants: [{
                userId,
                userName: user.name,
                role: 'host',
                joinedAt: new Date(),
                isActive: true
            }],
            isActive: true,
            maxParticipants,
            settings,
            currentActivity: {
                type: 'study',
                startedAt: new Date()
            },
            createdAt: new Date()
        };

        activeRooms.set(roomId, studyRoom);
        
        // Initialize whiteboard for room
        whiteboards.set(roomId, {
            roomId,
            elements: [],
            lastModified: new Date()
        });

        // Initialize chat for room
        roomMessages.set(roomId, []);

        // Emit room created event
        const io = getIO();
        io.emit('room_created', {
            roomId,
            name,
            courseTitle: course.title,
            hostName: user.name,
            participantCount: 1
        });

        res.json({
            roomId,
            room: studyRoom,
            message: 'Study room created successfully'
        });

    } catch (error) {
        logger.error('Error creating study room:', error);
        res.status(500).json({ error: 'Failed to create study room' });
    }
};

export const joinStudyRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        if (!room.isActive) {
            return res.status(400).json({ error: 'Study room is not active' });
        }

        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ error: 'Study room is full' });
        }

        // Check if user already in room
        const existingParticipant = room.participants.find(p => p.userId === userId);
        if (existingParticipant) {
            existingParticipant.isActive = true;
            existingParticipant.joinedAt = new Date();
        } else {
            room.participants.push({
                userId,
                userName: user.name,
                role: 'participant',
                joinedAt: new Date(),
                isActive: true
            });
        }

        // Get course info
        const course = await Course.findById(room.courseId);

        // Emit user joined event to room
        const io = getIO();
        io.to(roomId).emit('user_joined', {
            userId,
            userName: user.name,
            participantCount: room.participants.filter(p => p.isActive).length
        });

        res.json({
            room,
            course: course ? { title: course.title, description: course.description } : null,
            whiteboard: whiteboards.get(roomId),
            recentMessages: roomMessages.get(roomId)?.slice(-50) || []
        });

    } catch (error) {
        logger.error('Error joining study room:', error);
        res.status(500).json({ error: 'Failed to join study room' });
    }
};

export const leaveStudyRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        const participantIndex = room.participants.findIndex(p => p.userId === userId);
        if (participantIndex === -1) {
            return res.status(400).json({ error: 'User not in this room' });
        }

        // Mark as inactive instead of removing
        room.participants[participantIndex].isActive = false;

        // If host leaves, transfer to another participant or close room
        if (room.hostId === userId) {
            const activeParticipants = room.participants.filter(p => p.isActive && p.userId !== userId);
            if (activeParticipants.length > 0) {
                room.hostId = activeParticipants[0].userId;
                activeParticipants[0].role = 'host';
            } else {
                room.isActive = false;
            }
        }

        // Emit user left event
        const io = getIO();
        io.to(roomId).emit('user_left', {
            userId,
            participantCount: room.participants.filter(p => p.isActive).length,
            newHostId: room.hostId
        });

        res.json({ message: 'Left study room successfully' });

    } catch (error) {
        logger.error('Error leaving study room:', error);
        res.status(500).json({ error: 'Failed to leave study room' });
    }
};

export const getActiveRooms = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.query;
        
        let rooms = Array.from(activeRooms.values()).filter(room => room.isActive);
        
        if (courseId) {
            rooms = rooms.filter(room => room.courseId === courseId);
        }

        // Get course titles
        const courseIds = [...new Set(rooms.map(room => room.courseId))];
        const courses = await Course.find({ _id: { $in: courseIds } }).select('title');
        const courseMap = new Map(courses.map(c => [c._id.toString(), c.title]));

        const roomsWithDetails = rooms.map(room => ({
            id: room.id,
            name: room.name,
            courseTitle: courseMap.get(room.courseId) || 'Unknown Course',
            hostName: room.participants.find(p => p.role === 'host')?.userName || 'Unknown',
            participantCount: room.participants.filter(p => p.isActive).length,
            maxParticipants: room.maxParticipants,
            currentActivity: room.currentActivity.type,
            isPublic: room.settings.isPublic,
            createdAt: room.createdAt
        }));

        res.json({ rooms: roomsWithDetails });

    } catch (error) {
        logger.error('Error getting active rooms:', error);
        res.status(500).json({ error: 'Failed to get active rooms' });
    }
};
export const updateWhiteboard = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const { elements } = req.body;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        const participant = room.participants.find(p => p.userId === userId && p.isActive);
        if (!participant) {
            return res.status(403).json({ error: 'Not authorized to edit whiteboard' });
        }

        const whiteboard = whiteboards.get(roomId);
        if (whiteboard) {
            whiteboard.elements = elements;
            whiteboard.lastModified = new Date();
            
            // Emit whiteboard update to all room participants
            const io = getIO();
            io.to(roomId).emit('whiteboard_updated', {
                elements,
                updatedBy: participant.userName,
                timestamp: new Date()
            });
        }

        res.json({ message: 'Whiteboard updated successfully' });

    } catch (error) {
        logger.error('Error updating whiteboard:', error);
        res.status(500).json({ error: 'Failed to update whiteboard' });
    }
};

export const sendRoomMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const { message, type = 'text' } = req.body;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        const participant = room.participants.find(p => p.userId === userId && p.isActive);
        if (!participant) {
            return res.status(403).json({ error: 'Not authorized to send messages' });
        }

        if (!room.settings.allowChat) {
            return res.status(403).json({ error: 'Chat is disabled in this room' });
        }

        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            userName: participant.userName,
            message,
            type,
            timestamp: new Date()
        };

        const messages = roomMessages.get(roomId) || [];
        messages.push(chatMessage);
        roomMessages.set(roomId, messages);

        // Emit message to all room participants
        const io = getIO();
        io.to(roomId).emit('new_message', chatMessage);

        res.json({ message: 'Message sent successfully', messageId: chatMessage.id });

    } catch (error) {
        logger.error('Error sending room message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const startGroupActivity = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const { activityType, data } = req.body;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        if (room.hostId !== userId) {
            return res.status(403).json({ error: 'Only room host can start activities' });
        }

        room.currentActivity = {
            type: activityType,
            startedAt: new Date(),
            data
        };

        // Emit activity started event
        const io = getIO();
        io.to(roomId).emit('activity_started', {
            type: activityType,
            data,
            startedBy: room.participants.find(p => p.userId === userId)?.userName
        });

        res.json({ 
            message: 'Activity started successfully',
            activity: room.currentActivity
        });

    } catch (error) {
        logger.error('Error starting group activity:', error);
        res.status(500).json({ error: 'Failed to start activity' });
    }
};

export const getRoomAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        if (room.hostId !== userId) {
            return res.status(403).json({ error: 'Only room host can view analytics' });
        }

        const messages = roomMessages.get(roomId) || [];
        const whiteboard = whiteboards.get(roomId);

        const analytics = {
            totalParticipants: room.participants.length,
            activeParticipants: room.participants.filter(p => p.isActive).length,
            totalMessages: messages.length,
            whiteboardElements: whiteboard?.elements.length || 0,
            sessionDuration: new Date().getTime() - room.createdAt.getTime(),
            participantEngagement: room.participants.map(p => ({
                userName: p.userName,
                joinedAt: p.joinedAt,
                messageCount: messages.filter(m => m.userId === p.userId).length,
                whiteboardContributions: whiteboard?.elements.filter(e => e.userId === p.userId).length || 0
            })),
            activityHistory: [room.currentActivity]
        };

        res.json({ analytics });

    } catch (error) {
        logger.error('Error getting room analytics:', error);
        res.status(500).json({ error: 'Failed to get room analytics' });
    }
};

export const closeStudyRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?.id;

        const room = activeRooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Study room not found' });
        }

        if (room.hostId !== userId) {
            return res.status(403).json({ error: 'Only room host can close the room' });
        }

        room.isActive = false;

        // Emit room closed event
        const io = getIO();
        io.to(roomId).emit('room_closed', {
            message: 'Room has been closed by the host',
            closedAt: new Date()
        });

        // Clean up after 1 hour
        setTimeout(() => {
            activeRooms.delete(roomId);
            whiteboards.delete(roomId);
            roomMessages.delete(roomId);
        }, 60 * 60 * 1000);

        res.json({ message: 'Study room closed successfully' });

    } catch (error) {
        logger.error('Error closing study room:', error);
        res.status(500).json({ error: 'Failed to close study room' });
    }
};