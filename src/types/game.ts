export interface Player {
  id: number;
  name: string;
  points: number;
  eliminated: boolean;
  isComputer: boolean;
}

export interface Die {
  id: number;
  value: number | null;
  kept: boolean;       // Permanently kept this turn
  selected: boolean;   // Player has clicked to select for keeping
  rolling: boolean;    // Animation state
}

export type GamePhase =
  | 'setup'
  | 'pre-roll'        // Waiting for player to roll
  | 'selecting'       // Player selects which dice to keep
  | 'result'          // Showing turn result
  | 'bonus-pre-roll'  // Bonus phase: about to roll all 6
  | 'bonus-result'    // Bonus phase: showing results (hits or miss)
  | 'game-over';
