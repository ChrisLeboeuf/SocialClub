import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Map, GoogleApiWrapper, Marker, InfoWindow,
} from 'google-maps-react';
import axios from 'axios';
import { GOOGLE_TOKEN } from './googleConfig';

class MapContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      eventCords: {},
      showingInfoWindow: false,
      activeMarker: {},
      selectedPlace: {},
    };

    this.convertAddress = this.convertAddress.bind(this);
    this.loadCords = this.loadCords.bind(this);
    this.onMarkerClick = this.onMarkerClick.bind(this);
    this.onMapClicked = this.onMapClicked.bind(this);
    this.handleJoinClick = this.handleJoinClick.bind(this);
    this.handleViewClick = this.handleViewClick.bind(this);
    this.getAllEvents = this.getAllEvents.bind(this);
  }

  componentDidMount() {
    this.getAllEvents();
  }

  onMarkerClick(props, marker) {
    console.log('Cowboy', props);
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: !this.state.showingInfoWindow,
    });
  }

  onMapClicked(props) {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null,
      });
    }
  }

  onInfoWindowOpen(props, e) {
    const { selectedPlace, activeMarker } = this.state;
    const infoWindow = (
      <div>
        <div>
          <h3>{selectedPlace.name}</h3>
          <p>Address: {selectedPlace.address}</p>
          <p>Time: {selectedPlace.time}</p>
          <p>Category: {selectedPlace.category}</p>
          <p>Summary: {selectedPlace.summary}</p>
          <button onClick={this.handleJoinClick}>JOIN</button>
          {/* <button
            onClick={() => {
              this.handleViewClick({ target: { id: activeMarker.id } });
            }}
          >
            VIEW EVENT
          </button> */}
        </div>
      </div>
    );
    ReactDOM.render(
      React.Children.only(infoWindow),
      document.getElementById('iwc'),
    );
  }

  getAllEvents() {
    axios.get('api/event/events').then(events => {
      this.setState({
        events: events.data,
      });
      this.loadCords();
    });
  }

  convertAddress(address) {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ lat, lng });
        } else {
          reject(status);
        }
      });
    });
  }

  loadCords() {
    this.state.events.forEach(event => {
      this.convertAddress(event.address)
        .then(cords => {
          this.setState(prevState => {
            const eventCords = { ...prevState.eventCords };
            eventCords[event.id] = cords;
            return { eventCords };
          });
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  handleJoinClick() {
    const eventId = this.state.activeMarker.id;
    const { userId } = this.props;
    axios.post(`/api/rsvp/rsvp/${eventId}/${userId}`)
      .then((res) => {
        console.log(res.data);
      })
      .catch(res => {
        console.log(res.data);
      });
  }

  handleViewClick(eventId) {
    this.props.viewSummary(eventId);
  }

  render() {
    const styles = {
      map: {
        margin: '15px',
        position: 'absolute',
        top: '50px',
      },
    };
    const { google } = this.props;
    const { eventCords, activeMarker, showingInfoWindow } = this.state;
    return (
      <div className="map">
        <Map
          style={styles.map}
          google={google}
          zoom={10}
          minZoom={2}
          maxZoom={15}
          // style={mapStyles}
          initialCenter={{ lat: 29.969, lng: -90.0733 }}
          disableDefaultUI
          onClick={this.onMapClicked}
        >
          {this.state.events.map(event => (
            <Marker
              id={event.id}
              address={event.address}
              time={event.time}
              category={event.category}
              summary={event.summary}
              name={event.name}
              onClick={this.onMarkerClick}
              key={event.id}
              position={eventCords[event.id]}
            />
          ))}
          <InfoWindow
            marker={activeMarker}
            visible={showingInfoWindow}
            onOpen={e => {
              this.onInfoWindowOpen(this.props, e);
            }}
          >
            <div id="iwc" />
          </InfoWindow>
        </Map>
      </div>
    );
  }
}

MapContainer.propTypes = {
};

export default GoogleApiWrapper({
  apiKey: GOOGLE_TOKEN,
})(MapContainer);
