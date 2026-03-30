import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, PenTool, Mic, MicOff, Video, VideoOff, Share, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io, { Socket } from 'socket.io-client';

interface Participant {
    userId: string;
    userName: string;
    role: 'host' | 'participant';
    isActive: boolean;
}

interface WhiteboardElement {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'text';
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[];
    text?: string;
    color: string;
    strokeWidth: number;
}

interface StudyRoomProps {
    roomId: string;
    onLeave: () => void;
}

const StudyRoom: React.FC<StudyRoomProps> = ({ roomId, onLeave }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState<'pen' | 'rectangle' | 'circle' | 'text'>('pen');
    const [currentColor, setCurrentColor] = useState('#000000');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'participants'>('chat');
    const [roomInfo, setRoomInfo] = useState<any>(null);
    
    const socketRef = useRef<Socket | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
        
        // Join room
        joinRoom();

        // Socket event listeners
        socketRef.current.on('user_joined', handleUserJoined);
        socketRef.current.on('user_left', handleUserLeft);
        socketRef.current.on('new_message', handleNewMessage);
        socketRef.current.on('whiteboard_updated', handleWhiteboardUpdate);
        socketRef.current.on('activity_started', handleActivityStarted);
        socketRef.current.on('room_closed', handleRoomClosed);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const joinRoom = async () => {
        try {
            const response = await fetch(`/api/collaboration/rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRoomInfo(data.room);
                setParticipants(data.room.participants.filter((p: Participant) => p.isActive));
                setMessages(data.recentMessages || []);
                setWhiteboardElements(data.whiteboard?.elements || []);
                
                // Join socket room
                socketRef.current?.emit('join_room', roomId);
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    const leaveRoom = async () => {
        try {
            await fetch(`/api/collaboration/rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            socketRef.current?.emit('leave_room', roomId);
            onLeave();
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`/api/collaboration/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: newMessage,
                    type: 'text'
                })
            });

            if (response.ok) {
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const updateWhiteboard = async () => {
        try {
            await fetch(`/api/collaboration/rooms/${roomId}/whiteboard`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    elements: whiteboardElements
                })
            });
        } catch (error) {
            console.error('Error updating whiteboard:', error);
        }
    };

    // Socket event handlers
    const handleUserJoined = (data: any) => {
        setParticipants(prev => [...prev.filter(p => p.userId !== data.userId), {
            userId: data.userId,
            userName: data.userName,
            role: 'participant',
            isActive: true
        }]);
    };

    const handleUserLeft = (data: any) => {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    };

    const handleNewMessage = (message: any) => {
        setMessages(prev => [...prev, message]);
    };

    const handleWhiteboardUpdate = (data: any) => {
        setWhiteboardElements(data.elements);
    };

    const handleActivityStarted = (data: any) => {
        // Handle activity started
        console.log('Activity started:', data);
    };

    const handleRoomClosed = (data: any) => {
        alert('Room has been closed by the host');
        onLeave();
    };

    // Whiteboard functions
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (currentTool === 'pen') {
            const newElement: WhiteboardElement = {
                id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'line',
                x,
                y,
                points: [x, y],
                color: currentColor,
                strokeWidth: 2
            };
            setWhiteboardElements(prev => [...prev, newElement]);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || currentTool !== 'pen') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setWhiteboardElements(prev => {
            const newElements = [...prev];
            const lastElement = newElements[newElements.length - 1];
            if (lastElement && lastElement.points) {
                lastElement.points.push(x, y);
            }
            return newElements;
        });
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            updateWhiteboard();
        }
    };

    // Render whiteboard
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw elements
        whiteboardElements.forEach(element => {
            ctx.strokeStyle = element.color;
            ctx.lineWidth = element.strokeWidth;
            ctx.lineCap = 'round';

            if (element.type === 'line' && element.points) {
                ctx.beginPath();
                for (let i = 0; i < element.points.length - 1; i += 2) {
                    if (i === 0) {
                        ctx.moveTo(element.points[i], element.points[i + 1]);
                    } else {
                        ctx.lineTo(element.points[i], element.points[i + 1]);
                    }
                }
                ctx.stroke();
            }
        });
    }, [whiteboardElements]);

    return (
        <div className="fixed inset-0 bg-gray-900 flex">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-semibold">{roomInfo?.name}</h1>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <Users className="w-4 h-4" />
                            <span>{participants.length} participants</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-lg ${isMuted ? 'bg-red-600' : 'bg-gray-600'} hover:bg-opacity-80`}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-2 rounded-lg ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:bg-opacity-80`}
                        >
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                        <button className="p-2 rounded-lg bg-gray-600 hover:bg-opacity-80">
                            <Share className="w-5 h-5" />
                        </button>
                        <button
                            onClick={leaveRoom}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Leave Room
                        </button>
                    </div>
                </div>

                {/* Whiteboard */}
                <div className="flex-1 bg-white relative">
                    {activeTab === 'whiteboard' && (
                        <>
                            <div className="absolute top-4 left-4 z-10 flex space-x-2">
                                <button
                                    onClick={() => setCurrentTool('pen')}
                                    className={`p-2 rounded-lg ${currentTool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                >
                                    <PenTool className="w-5 h-5" />
                                </button>
                                <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => setCurrentColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300"
                                />
                                <button
                                    onClick={() => setWhiteboardElements([])}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Clear
                                </button>
                            </div>
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="w-full h-full cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-gray-100 dark:bg-gray-800 flex flex-col">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 p-3 text-sm font-medium ${activeTab === 'chat' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500'}`}
                    >
                        <MessageCircle className="w-4 h-4 mx-auto mb-1" />
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('whiteboard')}
                        className={`flex-1 p-3 text-sm font-medium ${activeTab === 'whiteboard' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500'}`}
                    >
                        <PenTool className="w-4 h-4 mx-auto mb-1" />
                        Board
                    </button>
                    <button
                        onClick={() => setActiveTab('participants')}
                        className={`flex-1 p-3 text-sm font-medium ${activeTab === 'participants' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-500'}`}
                    >
                        <Users className="w-4 h-4 mx-auto mb-1" />
                        People
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((message, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                {message.userName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">{message.message}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'participants' && (
                        <div className="p-4 space-y-3">
                            {participants.map((participant) => (
                                <div key={participant.userId} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                        {participant.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {participant.userName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {participant.role}
                                        </p>
                                    </div>
                                    {participant.role === 'host' && (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                            Host
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudyRoom;