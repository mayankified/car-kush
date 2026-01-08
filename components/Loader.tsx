import React from 'react'

const Loader = () => {
    return (
        <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
            {/* Premium Gradient Spinner */}
            <div className="relative mb-6">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>

                {/* The Spinning Ring */}
                <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>

                {/* Center Static Icon (Optional) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
            </div>

            {/* Loading Text */}
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
                    Initializing System
                </h2>
                <div className="flex gap-1">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></span>
                </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Establishing Secure Connection...
            </p>
        </div>
    )
}

export default Loader