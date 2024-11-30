import cors from 'cors';
import express from 'express';
import dns from 'dns';
import fs from 'fs';


const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const port = process.env.PORT || 2500;

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});




app.post('/api/shorturl', (req, res) => {

    let urlShort = '';

    const urlGen = () => {
        for(let i = 0; i < 6; i++){
            const num = Math.floor(Math.random() * 6);
            urlShort += num;
        }
    }

    urlGen();
    
    const shortUrl = async () => {
        if(fs.existsSync('./all_url.json')){

            let newData = '';

           const promise = new Promise((resolve, reject) => {
            fs.readFile('./all_url.json', (err, data) => {
                if(err) throw err;
                const allUrl = JSON.parse(data.toString());
                let i = 0;
                while(i < allUrl.length){
                    if(allUrl[i].url == urlShort){
                        console.log('urlError; generating new url...');
                        urlShort = '';
                        urlGen();
                        i = 0;
                    } else {
                        i++;
                    }
                }

                allUrl.push({url: urlShort, longUrl: req.body['URL']});
                newData = allUrl;
                resolve();
            });
           })

           promise.then(() => {

            fs.writeFile('./all_url.json', JSON.stringify(newData), err => {
                if(err) throw err;
                res.json({original_url: req.body['URL'], short_url: urlShort});
            });

           });
           
        } else{
            fs.writeFile('./all_url.json', JSON.stringify([{url: urlShort, longUrl: req.body['URL']}]), err => {
                if(err) throw err;
                res.json({original_url: req.body['URL'], short_url: urlShort});
            });
        }
    }

    try{
        const userUrl = new URL(req.body['URL']);
        dns.lookup(`${userUrl.hostname}`,  (err, address) => {
            if(err){
                res.json({'error': 'invalid url'});
            } else {
                shortUrl();
            }
        })
    } catch(error){
        console.log(error);
        res.json({'error': 'invalid url'});
    }

});


if(fs.existsSync('./all_url.json')){
    fs.readFile('./all_url.json', (err, data) => {
        if(err) throw err;
        JSON.parse(data.toString()).forEach(urlData => {
            app.get(`/api/shorturl/${urlData.url}`, (req, res) => {
                res.redirect(`/${urlData.longUrl}`);
            });
        });
    });
}