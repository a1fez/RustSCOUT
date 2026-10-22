import type { SearchHistoryItem } from './searchHistory';

const HISTORY_STORAGE_KEY = 'rustscout:searchHistory';


export const HISTORY_LIMIT = 20;

export function addToHistory (list: SearchHistoryItem[], item: SearchHistoryItem): SearchHistoryItem[]{

   const withOutDuplicate = list.filter((old) => {
    if(old.mode === item.mode && old.query === item.query) {
        return false;
   } else return true})

   const withNew = [item, ...withOutDuplicate];

   return withNew.slice(0, HISTORY_LIMIT);
}

export function loadHistory(): SearchHistoryItem[]{
    try{
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if(!raw) return[];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)){
            return parsed;
        } else {
            return [];
        }
    } catch {
        return [];
    }
}

export function saveHistory(list: SearchHistoryItem[]): void {
    
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
    } catch {
        // не сохранилось, не страшно
    }
}