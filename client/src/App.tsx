import { useState } from "react";
import Navbar from "./navbar/navbar";
import CardContainer from "./cardContainer/cardContainer";
import Search from "./search/search";
import './main.css';

export interface SearchData {
  steamId: string;
  serverId: string;
  timestamp: number;
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState<SearchData | null>(null);
  const [currentPage, setCurrentPage] = useState<'search' | 'roadmap'>('search');
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
      <Navbar onOpenRoadmap={() => setCurrentPage('roadmap')} onSelectTab={(tab) => setCurrentPage(tab === 'ПОИСК' ? 'search' : 'roadmap')} />
      
      {currentPage === 'search' && (
        <>
          <Search onSearch={handleSearch} />
          <CardContainer searchQuery={searchQuery} />
          <h1>Hello!</h1>
        </>
      )}
    </>
  );
};

export default App;