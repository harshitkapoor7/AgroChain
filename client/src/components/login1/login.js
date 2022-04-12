import React, {useState} from "react"
import "./login.css"
import axios from "axios"
import history from '../../history';
import { ToastContainer, toast } from 'react-toastify';
import { injectStyle } from "react-toastify/dist/inject-style";


if (typeof window !== "undefined") {
    injectStyle();
  }
const Login = ({ setLoginUser}) => {

    const [ user, setUser] = useState({
        email:"",
        password:""
    })

    const handleChange = e => {
        const { name, value } = e.target
        setUser({
            ...user,
            [name]: value
        })
    }
    function notify() {
        toast.dark("Hey 👋, see how easy!");
      }
    const login = () => {
        axios.post(`${document.location.origin}/login`, user)
        .then(res => {
            // alert(res.data.message)
            toast(res.data.message, {
                position: "top-right",
                autoClose: 1200,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
            
            setTimeout(()=>{
                setLoginUser(res.data.user)
            console.log(res.data.user);
            history.push("/")
            },1900);
        })
    }

    return (
        <div className="login">

      
            <h1>AgroChain</h1>
            <input type="text" name="email" value={user.email} onChange={handleChange} placeholder="Enter your Email"></input>
            <input type="password" name="password" value={user.password} onChange={handleChange}  placeholder="Enter your Password" ></input>
            <div className="button" onClick={login} id="animate.css">Login <ToastContainer /></div>
            
            <div className="or">
                <div className="HorizontalLine"></div>
                <div className="TextOr">or</div>
                <div className="HorizontalLine"></div>
            </div>
            <div className="button" onClick={() => history.push("/register")}>New Here? Register</div>
        </div>
    )
}

export default Login