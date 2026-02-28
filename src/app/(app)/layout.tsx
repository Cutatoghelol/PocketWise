import Sidebar from '@/components/Sidebar/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
