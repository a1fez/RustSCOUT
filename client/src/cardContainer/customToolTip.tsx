import "./toolTip.css";

export const CustomTooltip = ({ text }: { text: string }) => {
  return (
    <div className="tooltipContainer">
      <svg
        className="tooltipTail"
        viewBox="0 0 200 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Контур: радиус углов 6px, плавный скругленный носик снизу */}
        <path
          d="M 6 2 
             H 174 
             A 6 6 0 0 1 178 8 
             V 40 
             A 6 6 0 0 1 174 46 
             H 101 
             Q 96 46 93 50 
             Q 90 54 87 50 
             Q 84 46 79 46 
             H 6 
             A 6 6 0 0 1 2 40 
             V 8 
             A 6 6 0 0 1 6 2 
             Z"
          fill="#1b1b1bbe"
          stroke="#494949"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Текстовая область со строгими отступами от рамок */}
        <foreignObject x="-10" y="5" width="200" height="40">
          <div className="tooltipText">
            {text}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};