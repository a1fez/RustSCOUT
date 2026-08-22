import './navbar.css'
import logo from '../resource/rustScout3.png';

import { BiArchive } from "react-icons/bi";
import { GoGear } from "react-icons/go";


const Navbar = () => {
    return (
        <div className="navbar">
            <div className="logo"> 
                <img src={logo} alt="Logo" />
            </div>
            <ul className="menu">
                <li>Main</li>
                <li>Search</li>
                <li>Information</li>
            </ul>

            <div className="settings">
                <BiArchive className="icon" />
                <GoGear className="icon" />
            </div>


        </div>
    )
}

export default Navbar;