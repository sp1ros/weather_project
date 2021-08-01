const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
app.use(cors());
app.use(express.json());


//CREATE city 

app.post("/cities", async (req, res) => {
    try {
        const client = await pool.connect();
        const {city_name,curr_temp} = req.body;
        const cityCheck = await client.query("SELECT * FROM weather WHERE city_name = $1", [city_name]);
        if (!cityCheck.rows.length) {
            const newCity = await client.query("INSERT INTO weather (city_name, curr_temp, min_temp, max_temp, avg_temp, times_checked, active, temp_sum) VALUES( $1, $2, $3, $4, $5, 1, true, $6) RETURNING *",
                [city_name, curr_temp, curr_temp, curr_temp, curr_temp, curr_temp]
            );
            res.json(newCity.rows[0]);
            client.release();
        } else {
            const cityCheckActive = await client.query("SELECT * FROM weather WHERE city_name = $1 AND active = true ", [city_name])
            if (!cityCheckActive.rows.length) {
                const updatCity = await client.query("UPDATE weather SET active = true WHERE city_name = $1",
                    [city_name]
                );
                res.json('City is active again');
                client.release();
            } else {
                res.json('City is already active');
                client.release();
            }
        }
    } catch (err) {
        console.error(err.message);
        client.release();
        await res.status(500).json({ error: err });
    }
});

//GET ALL

app.get("/cities", async (req, res) => {
    try {
        const client = await pool.connect();
        const allCities = await client.query("SELECT * FROM weather WHERE active = TRUE");
        res.json(allCities.rows);
        client.release();
    } catch (err) {
        console.error(err.message);
        client.release();
        await res.status(500).json({ error: err });
    }
});

//REMOVE FROM ACTIVE LIST

app.put("/cities/:name", async (req, res) => {
    try {
        const client = await pool.connect();
        const { name } = req.params;
        const updatCity = await client.query("UPDATE weather SET active = false WHERE city_name = $1",
            [name]
        );
        res.json(name + " was set to inactive");
        client.release();
    } catch (err) {
        console.error(err.message);
        client.release();
        await res.status(500).json({ error: err });
    }
});

// UPDATE ALL ACTIVE

app.get("/cities/:name/:curr_temp", async (req, res) => {
    try {
        const client = await pool.connect();
        const { name,curr_temp } = req.params;
        const cityStats = await client.query("SELECT * FROM weather WHERE city_name = $1", [name]);
        res.json(cityStats.rows);
        var min_temp = cityStats.rows[0].min_temp;
        var max_temp = cityStats.rows[0].max_temp;
        var avg_temp = cityStats.rows[0].avg_temp;
        var temp_sum = cityStats.rows[0].temp_sum;
        var times_checked = cityStats.rows[0].times_checked;
        if (curr_temp <= cityStats.rows[0].min_temp) {
            min_temp = curr_temp;
        }
        if (curr_temp > cityStats.rows[0].max_temp) {
            max_temp = curr_temp;
        }
        temp_sum = (Number(curr_temp) + Number(temp_sum)).toFixed(2);
        times_checked += 1;
        avg_temp = (temp_sum / times_checked).toFixed(2);
        const newStats = await client.query("UPDATE weather SET curr_temp = $1, min_temp = $2, max_temp = $3, avg_temp = $4, times_checked = $5, temp_sum = $6 WHERE city_name = $7",
            [curr_temp, min_temp, max_temp, avg_temp, times_checked, temp_sum, name]
        );
        client.release();
    } catch (err) {
        console.error(err.message);
        client.release();
        await res.status(500).json({ error: err });
    }
});

app.listen(5000, () => {
    console.log("server started on port 5000");
});