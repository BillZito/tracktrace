import React from 'react';
import {render} from 'react-dom';
import { Button } from 'react-bootstrap';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';

const website = 'https://nameless-journey-97987.herokuapp.com';

class App extends React.Component {
  constructor(props){
    super(props);
    this.noRefreshGetTrack = this.noRefreshGetTrack.bind(this);
    this.getTrackInfo = this.getTrackInfo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    console.log('this', this.props.params.input);
    this.state = {
      id: this.props.params.input,
      data: null,
      notfound: false
    };
    if (this.state.id && !this.state.data) {
      this.getTrackInfo();
    }
  }

  noRefreshGetTrack(event) {
    event.preventDefault();
    this.getTrackInfo();
  }
  // get booking information from server
  getTrackInfo(){
    fetch(`${website}/bookings/${this.state.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then((resp)=> {
      console.log('resp is ', resp, 'status is', resp.status);
      if (resp.status == 404){
        // if no b/l info, give user error message
        this.setState({
          notfound: true
        });
        return false;
      } else {
        return resp.json();
      }
    })
    .then((data)=>{
      if (data) { 
        console.log('data', data);
        this.setState({
          data: data,
          notfound: false
        });
      }
    })
    .catch((err)=> {
      console.log('err is', err);
    })
  }

  handleChange(event){
    const value = event.target.value;
    this.setState({[event.target.name]: value});
  }
  
  renderSubmit(){
    let submit = (
      <div className="main">
        <h1> Track and Trace </h1>
        <form onSubmit={this.noRefreshGetTrack}>
          <input
            name="id" type="text"
            onChange={this.handleChange}
          />
          <button className='btn' onSubmit={this.getTrackInfo}> 
            Find B/L 
          </button>
        </form> 
      </div>
    );
    return submit;
  }

  renderElement(){
    if (this.state.notfound) {
      return (<div> B/L not found, try again! </div>);
    } else if (this.state.data != null) {
      return (
        <div className="blInfo">     
          <div> <b> B/L Number: </b> {this.state.data.BLNumber}</div>
          <div> <b> Steamship Line: </b> {this.state.data.SteamshipLine}</div>
          <div> <b> Origin: </b> {this.state.data.Origin}</div>
          <div> <b> Destination: </b> {this.state.data.Destination}</div>
          <div> <b> Vessel: </b> {this.state.data.Vessel}</div>
          <div> <b> Voyage: </b> {this.state.data.Voyage}</div>
          <div> <b> VesselETA: </b> {this.state.data.VesselETA.split('T')[0]}</div>
          <div> 
            <div className="containerTitle"> <b> Containers: </b> </div>
            <div className="containerBox">
            {this.state.data.ListOfContainers.map((container, i)=>{
              return ( 
                <div key={container.Number}> {i + 1}:
                  <div> <b> Number: </b> {container.Number}</div>
                  <div> <b> Size: </b>{container.Size}'</div>
                  <div> <b> Type: </b>{container.Type}</div>
                </div>)
            })}
            </div>
          </div>
        </div>
        );
    } else {
      return (<div> Enter a B/L above </div>);
    }
  }

  render(){
    return (
      <div className="col-md-4 col-md-offset-1"> 
        {this.renderSubmit()}
        <div>
          {this.renderElement()}
        </div>
      </div>)
  }
}

const NotFound = () => (
  <h1>404.. This page is not found!</h1>);

class Routes extends React.Component{
    render(){
      return(
        <Router history={browserHistory}>
          <Route path='/' component={App} />
          <Route path='/bookings/:input' component={App} />
          <Route path='/*' component={NotFound} />
        </Router>
        );
    }
}

render(<Routes />, document.getElementById('app'));