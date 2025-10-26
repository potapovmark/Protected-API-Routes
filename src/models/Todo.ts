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

// Индексы для оптимизации производительности
todoSchema.index({ userId: 1, createdAt: -1 }); // Основной индекс - пользователь + дата создания
todoSchema.index({ userId: 1, completed: 1 }); // Фильтр по статусу выполнения
todoSchema.index({ userId: 1, priority: 1 }); // Фильтр по приоритету
todoSchema.index({ userId: 1, category: 1 }); // Фильтр по категории
todoSchema.index({ userId: 1, dueDate: 1 }); // Поиск по дате выполнения
todoSchema.index({ dueDate: 1, completed: 1 }); // Поиск просроченных задач

todoSchema.pre('save',function(next) {
  this.updatedAt = new Date();
  next();
});

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
