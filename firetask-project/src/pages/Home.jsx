import { Link } from 'react-router-dom'
import "./Home.css"
import { useAuth } from '../context/AuthProvider'
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Home = () => {
    const { user } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed:", err);
        }
    }
  return (
    <div className='home'>
        <header className='home-header'>
            <h1 className='logo'>FireTask</h1>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/dashboard">Dashboard</Link>
                {user ? (
                    <button onClick={handleLogout} className="logout-link">Logout</button>
                    ) : (
                    <Link to="/auth">Login</Link>
                )}
            </nav>
        </header>

        <section className='features'>
            <div className="feature">
                <h3>Create Projects</h3>
                <p>Group related tasks under organized projects.</p>
            </div>
            <div className="feature">
                <h3>Manage Tasks</h3>
                <p>Add, update, or mark taks complete with ease.</p>
            </div>
            <div className="feature">
                <h3>Collaborate</h3>
                <p>Invite teammates and track progress together.</p>
            </div>
            <div className="feature">
                <h3>Activity Logs</h3>
                <p>Stay informed with automatic project activity logs.</p>
            </div>
        </section>

        <footer className='home-footer'>
        <p>&copy; {new Date().getFullYear()} FireTask — Built with ❤️</p>
        </footer>
    </div>
  )
}

export default Home
