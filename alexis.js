const express= require('express')
const mongoose= require('mongoose')
const PORT = 1432
const app = express()
app.use(express.json())


const results = new mongoose.Schema ( {
    state: String,
    parties: [String],
    result:{
       APC: Number,
       PDP: Number,
       LP: Number,
       NNPO: Number
    },
    Collectionofficer: String,
    isRigged: Boolean,
    totalvt:Number
})

const user = mongoose.model("election", results)

app.get("/",(req,res) => {
    res.status(200).json("welcome to the 2027 election results")

})

// creating a data

app.post("/createinfo", async(req, res)=>{
    const newresult = await new user(req.body);
    const electionresult = newresult.result

    let highestValue = -Infinity
    let winningparty = null
    for(const parties in electionresult){
        const value = electionresult[parties]

        if(value > highestValue){
            highestValue = value
            winningparty = parties
        }
    }
     newresult.save()
    res.status(200).json({
        message:`the winner of the state election is ${winningparty} with ${highestValue}`,
        data:newresult
    })
})

// get all datas

app.get("/getallresults", async(req, res) =>{
    const all = await user.find();

    res.status(200).json({
        message: "the available user are" + all.length, data:all
    })
})

// getting one data by id

app.get("/getoneresult/:id", async(req, res) =>{
    const id = req.params.id
    const onecontact = await user.findById(id)
    // console.log(oneuser)

    res.status(200).json({
        message: `the information of user id: ${id}`, 
        data: onecontact
    })
})

// delete a contact

app.delete("/deletedata/:id", async(req, res) =>{
    const contact = req.params.id
    const deleteuser = await user.findByIdAndDelete(contact)
        
        res.status(200).json({
            message: `the deleted user is recongnised with id: ${contact}`,
            data: deleteuser
    })

})

// updating a contact info

app.put("/updatedata/:id", async(req, res)=>{
    const contact = req.params.id
    const update = await user.findById(contact);
    const newupdate = {
        
        state: req.body.state || update.state,
        parties:req.body.parties || update.parties,
            result:{
            APC: req.body.APC || update.result.APC,
            PDP: req.body.PDP || update.result.PDP,
            LP: req.body.LP || update.result.LP,
            NNPO: req.body.NNPO || update.result.NNPO,
            },
            Collectionofficer: req.body.Collectionofficer || update.Collectionofficer,
        isRigged: req.body.isRigged || update.isRigged,
        totalvt: req.body.totalvt || update.totalvt,
    }
    const updated = await user.findByIdAndUpdate(contact, newupdate)

    res.status(200).json({
        message: `the data taged with id: ${contact} has been updated`,
        data: newupdate
    })
});

app.get("/overallWinner", async(req,res)=>{
    try{
        const allresults = await user.find();
        if(!allresults || allresults.length === 0){
            res.status(404).json({
                error:"no election results found",
            });
        }else{
            let overallresults = {};
            for (const result of allresults){
                const resultData = result.result;
                for(const party in resultData){
                    if(resultData.hasOwnProperty(party)){
                        const voteCount= resultData[party];
                        if(overallresults.hasOwnProperty(party)){
                        overallresults[party] += voteCount;
                        }else{
                            overallresults[party] = voteCount;
                        }
                    }
                }
            }
            let overallWinner = null;
            let highestVotecount = null;
            for(const party in overallresults){
                if(overallresults.hasOwnProperty(party)){
                    const voteCount= overallresults[party];
                    if(highestVotecount === null || voteCount > highestVotecount){
                        highestVotecount = voteCount;
                        overallWinner = party;
                    }
                }
            }
            res.status(200).json({
                overallWinner,
                results: overallresults,
            });
        }
    } catch (error){
        res.status(400).json({
            error:error.message,
        });
    }
});

app.get("/stateWinner/:state", async(req, res)=>{
    try{
        const{state}=req.params;
        const electionResult = await user.findOne({state});
        if(!electionResult){
            res.status(404).json({
                error:"No election result found for the specified state",
            });
        }else{
            const resultData = electionResult.result;
            let stateWinner = null;
            let highestVotecount = null;

            for(const party in resultData){
                if(resultData.hasOwnProperty(party)){
                    const voteCount = resultData[party];
                    if(highestVotecount === null || voteCount > highestVotecount){
                        highestVotecount = voteCount;
                        stateWinner = party;
                    }
                }
            }
            res.status(200).json({
                message: `the winner in this state is ${stateWinner}`,
                state,
                stateWinner,
            });
        }
    }catch (error){
        res.status(400).json({
            error:error.message,
        });
    }
});

app.get('/riggedresult', async (req,res)=>{
    try{
        const electionResults = await user.find();
        if(electionResults.length === 0){
            return res.status(404).json({
                Error:'No election results found',
            });
        }
        
        let riggedCount = 0;
        let notRiggedCount = 0;

        for(const electionResult of electionResults){
            if(electionResult.isRigged){
                riggedCount++;
            }else {
                notRiggedCount++;
            }
        }
        let overallRiggedResult;
        if(riggedCount > notRiggedCount){
            overallRiggedResult = 'Election seems rigged'
        }else if(riggedCount < notRiggedCount){
            overallRiggedResult = 'Election is not rigged'
        }else{
            overallRiggedResult = 'Election is fair'
        }
        res.status(200).json({
            overallRiggedResult,
            riggedCount,
            notRiggedCount
        });
    }catch(error){
        res.status(400).json({
            message:error.message,
        })
    }
})

mongoose.connect("mongodb+srv://ujunwastephen8:rARbdqyyfOzwPgLo@cluster0.tdmydgt.mongodb.net/").then(()=>{
    console.log("connection is true")
});

app.listen(PORT, (req,res)=>{
    console.log(`app is listening to port: ${PORT}`)
})