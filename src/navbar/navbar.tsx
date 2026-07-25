import './navbar.css'


const Navbar = () => {
    return (
        <div className="navbar">
            <div className="logo"> Logo </div>
            <ul className="menu">
                <li>Главная</li>
                <li>Поиск</li>
                <li>Информация</li>
            </ul>
        </div>
    )
}

export default Navbar;