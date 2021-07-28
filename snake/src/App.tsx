import React from 'react';
import './App.css';
import Game from './components/snake/Game';

function App(): React.ReactElement {
  return (
    <div className="App">
      <header className="App-header">
        <Game
          canvasWidth={500}
          canvasHeight={500}
          cell={20}
          speed={200}
          backgroundColour="#b3bc2f"
          objectColour="#35360c"
          leftKey="ArrowLeft"
          upKey="ArrowUp"
          rightKey="ArrowRight"
          downKey="ArrowDown"
        />
      </header>
    </div>
  );
}

export default App;
