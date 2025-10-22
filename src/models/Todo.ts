import mongoose, {Document, Schema} from 'mongoose';

export interface ITodo extends Document {
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dueDate: {
    type: Date
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

todoSchema.pre('save',function(next) {
  this.updatedAt = new Date();
  next();
});

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
