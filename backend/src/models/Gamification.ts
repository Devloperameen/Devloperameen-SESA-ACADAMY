import mongoose, { Schema, Document } from 'mongoose';

export interface IBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'achievement' | 'milestone' | 'special' | 'streak';
    earnedAt: Date;
}

export interface IStreak {
    current: number;
    longest: number;
    lastActivityDate: Date;
}

export interface IPointsHistory {
    points: number;
    reason: string;
    source: 'lesson' | 'quiz' | 'assignment' | 'streak' | 'bonus' | 'achievement';
    sourceId?: mongoose.Types.ObjectId;
    earnedAt: Date;
}

export interface IGamification extends Document {
    userId: mongoose.Types.ObjectId;
    totalPoints: number;
    level: number;
    badges: IBadge[];
    streak: IStreak;
    pointsHistory: IPointsHistory[];
    achievements: {
        lessonsCompleted: number;
        quizzesPassed: number;
        assignmentsSubmitted: number;
        perfectScores: number;
        coursesCompleted: number;
    };
    leaderboardRank?: number;
    createdAt: Date;
    updatedAt: Date;
}

const BadgeSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['achievement', 'milestone', 'special', 'streak'],
        required: true 
    },
    earnedAt: { type: Date, default: Date.now }
});

const StreakSchema = new Schema({
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now }
});

const PointsHistorySchema = new Schema({
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    source: { 
        type: String, 
        enum: ['lesson', 'quiz', 'assignment', 'streak', 'bonus', 'achievement'],
        required: true 
    },
    sourceId: { type: Schema.Types.ObjectId },
    earnedAt: { type: Date, default: Date.now }
});

const GamificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [BadgeSchema],
    streak: { type: StreakSchema, default: () => ({}) },
    pointsHistory: [PointsHistorySchema],
    achievements: {
        lessonsCompleted: { type: Number, default: 0 },
        quizzesPassed: { type: Number, default: 0 },
        assignmentsSubmitted: { type: Number, default: 0 },
        perfectScores: { type: Number, default: 0 },
        coursesCompleted: { type: Number, default: 0 }
    },
    leaderboardRank: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

GamificationSchema.pre('save', function(this: any) {
    this.updatedAt = new Date();
    
    // Calculate level based on points
    this.level = Math.floor(this.totalPoints / 1000) + 1;
});

// Indexes for leaderboard queries
GamificationSchema.index({ totalPoints: -1 });
GamificationSchema.index({ userId: 1 });

export default mongoose.model<IGamification>('Gamification', GamificationSchema);
