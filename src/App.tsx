import Navbar from "./navbar/navbar";
import CardContainer from "./cardContainer/cardContainer";

import Search from "./search/search";
import './main.css';
import { useState } from "react";


const App = () => {
  
  const [currentId, setCurrentId] = useState('');
  
  return (
    <>
      <Navbar />
      <Search onSearch={(id) => setCurrentId(id)} />
      <CardContainer steamId={currentId} />
      <h1>Hello!</h1>
    </>
  )
}

export default App;