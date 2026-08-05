import './navbar.css'
import logo from '../resource/rustScout3.png';

const Navbar = () => {
    return (
        <div className="navbar">
            <div className="logo"> 
                <img src={logo} alt="Logo" />
            </div>
            <ul className="menu">
                <li>Главная</li>
                <li>Поиск</li>
                <li>Информация</li>
            </ul>
        </div>
    )
}

export default Navbar;