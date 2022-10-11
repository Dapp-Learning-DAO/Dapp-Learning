import {client, recommendProfiles} from './api/api'
import {useState, useEffect} from 'react';
import { Image } from 'react-native';
import './App.css';

function App() {
  const [profiles, setProfiles] = useState([])

  useEffect(()=>{
    fetchProfiles().then(users=>{
      setProfiles(users)
    })
  }, [])

  if (profiles.length == 0){
    return (
      <div className='loading'>  
      </div>
    )
  }
  
  return (
    <div className="App">
      {
        profiles.map((p, index)=> (
          <UserContent profile={p} > </UserContent>
        ))
      }
    </div>
  );
}

function UserContent(props) {
  const profile = props.profile;
  return (
    <a >
      <div className="profile">
        {profile.picture?.original?.url?
              (<Image source={{uri: profile.picture.original.url}} style={{width: "60px", height: "60px"}}/>) :
              (<div style={{width: "60px", height: "60px", backgroundColor: 'red'}}></div>)
        }
        <h4>{profile.handle}</h4>
        <p>{profile.bio}</p>
      </div>
    </a>

  )
}

async function fetchProfiles() {
  try {
    const response = await client.query(recommendProfiles).toPromise();
    return response.data.recommendedProfiles;
  }
  catch(err){
    console.log({err})
  }
}

export default App;
