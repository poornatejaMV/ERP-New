// Reusable UI Components

export function Card({ children, className = '', hover = false }: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}) {
    return (
        <div className={`bg-white rounded-xl shadow-card ${hover ? 'hover:shadow-card-hover transition-shadow duration-200' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function PageHeader({ title, subtitle, action }: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function Button({ children, onClick, variant = 'primary', type = 'button', className = '' }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}) {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function Badge({ children, variant = 'default' }: {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
            {children}
        </span>
    );
}

export function Input({ label, error, ...props }: {
    label?: string;
    error?: string;
    [key: string]: any;
}) {
    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
            <input
                {...props}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export function Select({ label, error, children, ...props }: {
    label?: string;
    error?: string;
    children: React.ReactNode;
    [key: string]: any;
}) {
    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
            <select
                {...props}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export function Modal({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function StatCard({ title, value, icon, color = 'blue', subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
    subtitle?: string;
}) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    };

    return (
        <Card className={`p-6 bg-gradient-to-br ${colors[color]} text-white`} hover>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium opacity-90">{title}</h3>
                <span className="text-3xl opacity-80">{icon}</span>
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </Card>
    );
}
