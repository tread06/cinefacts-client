import React from 'react';
import axios from 'axios';
import MovieCard from '../movie-card/movie-card';
import MovieView from '../movie-view/movie-view';
import LoginView from '../login-view/login-view';
import RegistrationView from '../registration-view/registration-view';
import ProfileView from '../profile-view/profile-view';
import DirectorView from '../director-view/director-view';
import GenreView from '../genre-view/genre-view';

import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import './main-view.scss';


export default class MainView extends React.Component {  
  constructor(){
    super();
    this.state = {
      movies: [],
      selectedMovie: null,
      user: null      
    }    
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {    
    
    let accessToken = localStorage.getItem('token');    
    let userName = localStorage.getItem('user');

    if (accessToken !== null) {
      this.getUser(userName, accessToken);     
      this.getMovies(accessToken);
    }
  }

  getMovies(token) {
    axios.get('https://cinefacts-api.herokuapp.com/movies', {
      headers: { Authorization: `Bearer ${token}`}
    })
    .then(response => {
      this.setState({
        movies: response.data
      });            
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  getUser(userName, token) {    
    axios.get('https://cinefacts-api.herokuapp.com/users/' + userName, {
      headers: { Authorization: `Bearer ${token}`}
    })
    .then(response => {
      this.setState({
        user: response.data
      });  
    })
    .catch(function (error) {
      console.log(error);
    });
  }  

  setSelectedMovie(newSelectedMovie) {
    this.setState({
      selectedMovie: newSelectedMovie
    });
  }
  
  onLoggedIn(authData) {
    //store token and user in local storage
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', authData.user.Username);

    //update state from user data    
    this.getMovies(authData.token);
    this.getUser(authData.Username, authData.token);
    window.open('/', '_self');
  }  

  logout()
  {
    console.log("Logging out");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.setState({
      user: null
    });  
  }

  onUserUpdated(userData){
    this.logout();
  }
  onUserDeleted(){
    this.logout();
  }

  render() {   

    const {movies, user} = this.state;  
    
    //to do: nav bar component
    return (<>          
      <Navbar bg="light" expand="lg" sticky="top" className="nav-bar">
        <Container>
          <Navbar.Brand href="/">Cinefacts</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" >
            <Nav className="me-auto">
              <Nav.Link href="/">Movies</Nav.Link>
              <Nav.Link href="/">About</Nav.Link>              
            </Nav>
            <Nav>
            {user ? (              
              <NavDropdown title={user.Username} id="basic-nav-dropdown" >
                <NavDropdown.Item href={"/profile"}>Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={this.logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
              <Nav.Link href="/">Login</Nav.Link>
              <Nav.Link href="/register">Register</Nav.Link>
              </>
            )}  
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Router>
        <Row className="main-view justify-content-md-center"> 
          <Route exact path="/" render={() => {            
            if (!user) return <Col md={4}>
                <LoginView onLoggedIn={user => this.onLoggedIn(user)} />
              </Col> 

            if (movies.length === 0) return <div className="main-view" />;
                  
            return movies.map(m => (   
              <Col md={3} key={m._id}>      
                <MovieCard movie={m} />   
              </Col>
            ))
          }} />

          <Route path="/register" render={({ match, history }) => {
            if (user) return <Redirect to="/" />
            return <Col md={4}>
              <RegistrationView />
            </Col>
          }} />

          <Route path="/movies/:movieId" render={({ match, history }) => {
            if (!user) return <Col>
            <LoginView onLoggedIn={user => this.onLoggedIn(user)} />
            </Col>  
            
            return <Col md={8}>
              <MovieView 
                movie={movies.find(m => m._id === match.params.movieId)} 
                onBackClick={() => history.goBack()}
                onFavoriteClick={(movieId) => this.addFavorite(movieId)} 
                isFavorite = {user.FavoriteMovies.includes(match.params.movieId)}/>
            </Col>
          }} />

          <Route path="/profile" render={({ match, history }) => {
            if (!user) return <Col md={4}>
                <LoginView onLoggedIn={user => this.onLoggedIn(user)} />
              </Col>  
            return <Col md={8}>
              <ProfileView 
                user={user}
                updateUser={user => this.updateUser(user)} 
                movies = {movies}
                onProfileUpdated = {() => {this.onUserUpdated()}}
                onProfileDeleted = {() => {this.onUserDeleted()}}/>
            </Col>
          }} />

          <Route path="/directors/:name" render={({ match, history }) => {
            if (movies.length === 0) return <div className="main-view" />;
              return <Col md={8}>
                <DirectorView 
                  director={movies.find(m => m.Director.Name === match.params.name).Director} 
                  movies = {movies.filter(m => m.Director.Name === match.params.name)}
                  onBackClick={() => history.goBack()} />
              </Col>
          }} />

          <Route path="/genre/:name" render={({ match, history }) => {
            if (movies.length === 0) return <div className="genre-view" />;
              return <Col md={8}>
                <GenreView 
                genre={movies.find(m => m.Genre.Name === match.params.name).Genre} 
                movies = {movies.filter(m => m.Genre.Name === match.params.name)}
                onBackClick={() => history.goBack()} />
              </Col>
          }} />
        </Row>
      </Router>
      </>
    );  
  }
}