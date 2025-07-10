import { useState } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import "./SignUp.css"
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        

        if(!email.trim() || !password.trim()){
            setMessage("Email and Password are required.");
            return;
        }

        try {
         if(isLoggedIn) {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
            setMessage("Logged in successfully.");
         } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            const usersRef = collection(db, "users");
            await addDoc(usersRef, {
                email: newUser.email,
                role: "member",
                createdAt: new Date(),
            });
            navigate("/dashboard");
            setMessage("User created successfully.");
         }  
        } catch (err) {
            setMessage(err.message);
            console.error(err);
        } finally{
            setEmail("");
            setPassword("");
        }
    }

  return (
    <div className="sign-up">
        <h2>{isLoggedIn ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input 
            type="email"
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">
            {isLoggedIn ? "Login" : "Sign Up"}
        </button>
      </form>
      <p>{message}</p>
      <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
        {isLoggedIn ? "Need to sign up?" : "Already have an account? Login"}
      </button>
    </div>
  )
}

export default SignUp
