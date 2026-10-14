import React from 'react';
import './comingSoon.css';
import { LiaGrinWinkSolid } from 'react-icons/lia';

interface ComingSoonProps {
  onBack?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onBack }) => {
  return (
    <div className="comingSoonView">
      <h1 className="comingSoonTitle">В РАЗРАБОТКЕ.</h1>
      <h1 className="comingSoonTitle">СКОРО ПОЯВИТЬСЯ <LiaGrinWinkSolid /></h1> 
      

      {onBack && (
        <button className="comingSoonBackBtn" onClick={onBack} type="button">
          ← На главную
        </button>
      )}
    </div>
  );
};

export default ComingSoon;
