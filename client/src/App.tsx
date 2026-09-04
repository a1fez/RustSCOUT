import { useState } from "react";
import Navbar from "./navbar/navbar";
import CardContainer from "./cardContainer/cardContainer";
import Search from "./search/search";
import './main.css';
import { Roadmap } from "./pages/roadmap/roadmap";
import type { PlayerData } from "./cardContainer/player";
import { MainPage } from "./pages/main/mainPage";

export interface SearchData {
  steamId: string;
  serverId: string;
  timestamp: number;
}

const App = () => {
  
  const [cards, setCards] = useState<PlayerData[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, number>>({});


  const [searchQuery, setSearchQuery] = useState<SearchData | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('search');
  // Принимаем оба аргумента из Search
  const handleSearch = (steamId: string, serverIdOrName: string) => {
    if (!steamId) return;

    setSearchQuery({
      steamId: steamId.trim(),
      serverId: serverIdOrName ? serverIdOrName.trim() : '',
      timestamp: Date.now(), // чтобы поиск срабатывал даже при повторном клике
    });
  };

  return (
    <>
      <Navbar 
      onOpenRoadmap={() => setCurrentPage('roadmap')} 
      onSelectTab={(tab) => setCurrentPage(tab.toLocaleLowerCase())} 
      />
      
      {currentPage === 'search' && (
        <>
          <Search onSearch={handleSearch} />
          <CardContainer 
          searchQuery={searchQuery} 
          cards={cards} 
          setCards={setCards} 
          trackingMap={trackingMap} 
          setTrackingMap={setTrackingMap} 
          setSearchQuery={setSearchQuery} />
          <h1>Hello!</h1>
        </>
      )}

      {currentPage === 'roadmap' && (
        <Roadmap onBack={() => setCurrentPage('search')} />
      )}

      {currentPage === 'info' && (
        <div className="infoContainer">
          <h1>ИНФОРМАЦИЯ</h1>
          <p>Здесь будет отображаться информация о проекте.</p>
        </div>
      )}

      {currentPage === 'main' && (
        <MainPage />
      )}
    </>
  );
};

export default App;