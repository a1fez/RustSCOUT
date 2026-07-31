import Navbar from "./navbar/navbar";
import CardContainer from "./cardContainer/cardContainer";

import Search from "./search/search";
import './main.css';
import { useState } from "react";


const App = () => {
  

    
  const [currentId, setCurrentId] = useState('');

  const handleSearch = (id:string) => {
    setCurrentId(id);
      setTimeout(() =>{
        setCurrentId('');

      }, 100);
  }
  
  return (
    <>
      <Navbar />
      <Search onSearch={handleSearch} />
      <CardContainer steamId={currentId} />
      <h1>Hello!</h1>
    </>
  )
}

export default App;