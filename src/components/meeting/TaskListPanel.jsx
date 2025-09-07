import React, { useState } from 'react';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { MdChecklist, MdAdd, MdClose, MdDelete } from 'react-icons/md';

export default function TaskListPanel({ roomId }) {
  const { user } = useAuth();
  const { state, dispatch } = useMeeting();
  const { socket } = useSocket();
  const { tasks } = state;
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    const normalizedRoomId = roomId.trim().toLowerCase();
    socket.emit('task-add', { roomId: normalizedRoomId, text: input.trim(), createdBy: user?.displayName || 'You' });
    setInput('');
  };

  const handleToggle = (taskId) => {
    if (socket) socket.emit('task-toggle', { roomId, taskId });
  };

  const handleDelete = (taskId) => {
    if (socket) socket.emit('task-delete', { roomId, taskId });
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#0a0a1a] rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 transition-all duration-500">
      {/* Header — matches ChatPanel exactly */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-gray-900 dark:text-white">
            <MdChecklist size={20} />
          </div>
          <h3 className="text-[13px] font-black text-gray-900 dark:text-white font-karla-bold tracking-tight leading-none">Task List</h3>
        </div>
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_TASKS' })}
          className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-white/10"
        >
          <MdClose size={20} />
        </button>
      </div>

      {/* Tasks — chat-like scrollable area */}
      <div className={`flex-1 overflow-y-auto px-5 py-4 custom-scrollbar ${tasks.length === 0 ? 'flex flex-col justify-center' : ''}`}>
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-0 opacity-30">
            <MdChecklist size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-400 text-sm font-karla-medium italic">No tasks yet</p>
          </div>
        )}
        <div className="space-y-1">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center gap-3 px-4 py-3 rounded-[1.5rem] transition-all cursor-pointer group ${
                task.completed
                  ? 'bg-gray-100 dark:bg-white/5'
                  : 'bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5'
              }`}
              onClick={() => handleToggle(task._id)}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggle(task._id)}
                className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                    : 'border-gray-300 dark:border-white/20 bg-transparent'
                } data-[state=checked]:text-white`}
              />
              <span className={`flex-1 text-[13px] font-karla-medium leading-relaxed transition-all break-words overflow-hidden ${
                task.completed
                  ? 'text-gray-300 dark:text-white/30 line-through'
                  : 'text-gray-800 dark:text-white/90'
              }`}>
                {task.text}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(task._id); }}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
              >
                <MdDelete size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add task input — matches ChatPanel input style */}
      <div className="px-4 py-4">
        <form onSubmit={handleAdd} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a task..."
            className="w-full pl-6 pr-14 py-4 rounded-full bg-[#fafafa] dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/30 font-karla-medium focus:border-gray-300 dark:focus:border-white/20 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 transition-all active:scale-90"
          >
            <MdAdd size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
