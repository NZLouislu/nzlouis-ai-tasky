export interface Card {
  id: string;
  title: string;
  description?: string;
  due?: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}
