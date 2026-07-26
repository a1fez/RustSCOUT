import { FaSearch } from 'react-icons/fa';
import { useState } from 'react';

import './search.css';

interface SearchProps {
    onSearch: (text: string) => void;
}

const Search = ({ onSearch }: SearchProps) => {

    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim() === '') return;
        
      /*  if (text.length < 17 || text.length > 17) {
            alert('Это не SteamID_64. Он начинается c 7... Пример: 76561198000000000 ');
            return;
        } */

        onSearch(text.trim());
        
        setText('');
    }


    return (
        <div className="search">
            <div className="searchContainer">

                <input value={text} 
                onChange={(e) => setText(e.target.value)} 
                type="text" className="searchInput" 
                placeholder="Введите SteamID..." 
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} />

                <button className="searchButton" onClick={handleSubmit}>
                    <FaSearch className="searchIcon" />
                </button>
            </div>
           
        </div>
    )
} 

export default Search;