import React, { Fragment, useEffect, useState } from "react";
import PlacesAutocomplete from "react-places-autocomplete";
import { makeStyles } from '@material-ui/core/styles';
import Button from "@material-ui/core/Button";
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import { Grid } from "@material-ui/core";
import axios from 'axios';


const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  disabledButton: {
    backgroundColor: 'red'
  },
  center: {
    margin: "auto"
  }
}));

const Home = () => {
  const [address, setAddress] = useState("");
  const [cities, setCities] = useState([]);
  const [buttonStatus, setButtonStatus] = useState(false);
  const apiKey = process.env.REACT_APP_API_KEY;
  const classes = useStyles();

  const handleSelect = async value => {
    setAddress(value)
    var config = {
      method: 'get',
      url: 'http://api.openweathermap.org/data/2.5/find?q=' + value + '&appid=' + apiKey + '&units=metric',
      headers: {}
    };

    axios(config)
      .then((response) => {
        axios({
          method: 'post',
          url: 'http://localhost:5000/cities',
          headers: {},
          data: {
            city_name: address,
            curr_temp: response.data.list[0].main.temp
          }
        }).then((response) => {
          getCities();
        })
      })
      .catch((error) => {
        console.log(error)
      })
  }

  const deleteCity = async (city_name) => {
    try {
      const deleteCity = await fetch(`http://localhost:5000/cities/${city_name}`, {
        method: "PUT"
      });
      setCities(cities.filter(cities => cities.city_name !== city_name));
      alert(city_name + ' has been deleted!');
    } catch (err) {
      console.error(err.message);
      alert('Server error!');
    }
  }

  const getCities = async () => {
    try {
      const response = await fetch("http://localhost:5000/cities");
      const jsonData = await response.json();
      setCities(jsonData);
    } catch (err) {
      console.error(err.message);
      alert('Server error!');
    }
  };

  const updateTable = async () => {
    setButtonStatus(true);
    for (let index = 0; index < cities.length; index++) {
      var config = {
        method: 'get',
        url: 'http://api.openweathermap.org/data/2.5/find?q=' + cities[index].city_name + '&appid=' + apiKey + '&units=metric',
        headers: {}
      };
      axios(config)
        .then((response) => {
          axios({
            method: 'get',
            url: 'http://localhost:5000/cities/' + cities[index].city_name + "/" + response.data.list[0].main.temp,
            headers: {},
            data: {},
            params: {
              name: cities[index].city_name,
              curr_temp: response.data.list[0].main.temp
            },
          }).then((response) => {
            getCities();
            setButtonStatus(false);
          })
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  useEffect(() => {
    getCities();
  }, []);

  return (
    <Grid container>
      <Grid item xs={12}>
        <div className={classes.center}>
          <h1 className="text-center mt-5">Weather List</h1>
          <div>
            <PlacesAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={handleSelect}
            >
              {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                <div>
                  <input {...getInputProps({ placeholder: "Enter city name" })} />
                  <div>
                    {loading ? <div>...loading</div> : null}
                    {suggestions.map(suggestion => {
                      const style = {
                        backgroundColor: suggestion.active ? "#41b6e6" : "#fff"
                      };

                      return (
                        <div {...getSuggestionItemProps(suggestion, { style })}>
                          {suggestion.description}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </PlacesAutocomplete>
          </div>
          <table className="table mt-5 text-center">
            <thead className="thead-dark">
              <tr>
                <th>City Name</th>
                <th>Current Temperature</th>
                <th>Min Temperature</th>
                <th>Max Temperature</th>
                <th>Avg Temperature</th>
                <th><Button
                  disabled={false}
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={() => updateTable()}
                >Refresh Table</Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {cities.map(cities => (
                <tr key={cities.city_name}>
                  <td>{cities.city_name} °C</td>
                  <td>{cities.curr_temp} °C</td>
                  <td>{cities.min_temp} °C</td>
                  <td>{cities.max_temp} °C</td>
                  <td>{cities.avg_temp} °C</td>
                  <td>
                    <Button
                      variant="contained"
                      color="secondary"
                      className={classes.button}
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteCity(cities.city_name)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Grid>
    </Grid>

  );
}

export default Home;
