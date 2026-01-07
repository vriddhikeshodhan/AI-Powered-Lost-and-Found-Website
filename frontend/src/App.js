// import './App.css'; // This file isn't needed for the LandingPage component
import LandingPage from './components/LandingPage'; // Import your component with a relative path
//import LostPage from './components/LostPage.jsx';

function App() {
  return (
    <div className="App">
       <LandingPage />
      {/*<LostPage />*/}
    </div>
  );
}

export default App;