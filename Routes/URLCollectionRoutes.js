const express = require('express');
const router = express.Router();
const { poolpromise } = require('../Database/DatabaseSingleton')



const selectStatement = `SELECT C.ID, G.GroupID, G.GroupName, I.InfoScreenID, I.InfoScreenName, I.InfoScreenPower_State,
U.Url_ID, U.Url_Name, U.URL, M.MagicID, M.MagicHeight, M.MagicWidht, P.PresentationID, P.Repetition,
P.Time_Frame, P.Date FROM URL_Table U 
join URLCollections C ON U.Url_ID = C.URL_ID
Join InfoSceenPC I ON I.InfoScreenID = C.Info_Screen_ID
JOIN Groups G ON G.GroupID = C.groupID
Join MagicSettings M ON M.MagicID = U.MagicID
Join PresentationSettings P ON P.PresentationID = U.PresentationID `

//GET all collections and all data associated with them
router.get('/all',async (req, res, next) => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        const pool = await poolpromise
        const result = await pool.request().query(selectStatement + 'ORDER BY G.GroupID ASC')
        
        res.status(200).json({
            response: result.recordsets[0]
        });
    } catch (err) {
        res.status(400).json({
            error: err
        });
    }
});

//GET specific group data
router.get('/:groupID', async (req, res, next) => {
    try {
        const pool = await poolpromise;
        const result = await pool.request().query(selectStatement + `WHERE G.GroupID = ` + req.params.groupID);

        res.status(200).json({
            response: result.recordset
        })

    } catch (error) {
        res.status(400).json({
            error: error
        })
    }
});

//POST
router.post('/', async (req, res, err) => {
    try {
        var newID = null;
        let pool = await poolpromise;
        //Automatic ID creation
        //Getting last ID in table
        const LastID = await pool.request().query('SELECT TOP 1 ID FROM URLCollections ORDER BY ID DESC;  ')
        //Checking wether data came back or not
        //If mp data came back that mean the table is empty so the new ID will be 1
        if(LastID.recordset[0]){
            newID = parseInt(LastID.recordset[0].ID +1)
        }
        else{
            newID = 1
        }
        try {
            const result = await pool.request().query("INSERT INTO URLCollections VALUES ('" + newID + "', '" + req.body.Info_Screen_ID + "', '" 
                                                                                            + req.body.URL_ID + "', '" + req.body.groupID + "');")
            res.status(200).json({
                response: result
            })
        } catch (RequestError) {
            res.status(400).json({
                response: RequestError
            })
        }
        
    }catch (err) {
        console.log('Error happened: ' + err);
    }
});

//UPDATE
router.patch('/:collectionID', async (req, res, err) => {
    try {
        const collectionID = req.params.collectionID;
        let pool = await poolpromise;
        const result = await pool.request().query('select * from URLCollections WHERE ID = ' + collectionID)
        if (result.recordset[0]) {
            const result = await pool.request().query("UPDATE URLCollections SET Info_Screen_ID ='" + req.body.Info_Screen_ID + 
                                                      "', URL_ID = '" + req.body.URL_ID +
                                                      "', GroupID = '" + req.body.groupID +
                                                      "' WHERE ID = '" + collectionID + "' ;")
            res.status(200).json({
                response: "Success"
            })
        } else {
            res.status(404).json({
                response: "There is no data associated with this ID: " + collectionID
            })
        }
       
    }catch (err) {
        res.status(400).json({
            response: err
        })
    }
});

//DELETE
router.delete('/:collectionID', async (req, res, err) => {
    try {
        var collectionID = req.params.collectionID;
    let pool = await poolpromise;

    const result = await pool.request().query('select * from URLCollections WHERE ID = ' + collectionID)
    if (result.recordset[0]) {
        const result = await pool.request().query("DELETE FROM URLCollections WHERE ID='" + collectionID + "';")
    
        res.status(200).json({
            response: result
        })
    } else {
        res.status(404).json({
            response: "There is no data associated with this ID: " + collectionID
        })
    }
    }catch (err) {
        console.log('Error happened: ' + err);
    }
})

module.exports = router;