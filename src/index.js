
const { request } = require("express");
const { response } = require("express");
const express= require("express");
const {v4:uuid}=require("uuid");

const app=express();
app.use(express.json());
const customers=[];

function verifyIfExistAccountCPF(request,response,next){

    const { cpf }= request.headers;
    const customer= customers.find((customer)=>customer.cpf===cpf);
    if(!customer){
        response.status(400).json({"Error":"customer not found"});
    }else{
        request.customer=customer;
        return next()
    }
    ;
}
function getBalance(statement){
    
     const balance =  statement.reduce((acc,operation)=>{
        if(operation.type==='credit'){
            return acc+ operation.amount;
        }else{
            return acc- operation.amount;
        }
         
    },0)
    return balance;
}
 
app.post('/account',(request,response)=>{
    const {cpf,name}=request.body;
    const customerAlreadyExist=customers.some((customer)=>customer.cpf===cpf);
    
    if(customerAlreadyExist){
        response.status(400).json({"Error":"custumer already exist"});
    }else{
        customers.push({
            cpf,
            name,
            id:uuid(),
            statement:[]
        })
        response.status(201).json({"msg":"sucessful creation"})
    }
    
});
  
app.get('/statement',verifyIfExistAccountCPF,(request,response)=>{
        const {customer}=request;
        const statement=customer.statement;
        response.status(200).json({ statement});
})

app.post('/deposit',verifyIfExistAccountCPF,(request,response)=>{

    const { customer } = request;
    const {description,amount}=request.body;
    const statementOperation={
        description,
        amount,
        created_at: new Date(),
        type:"credit"
    }
    customer.statement.push(statementOperation);
    return response.status(200).json({msg:"deposit done"})

})

app.post('/withdraw',verifyIfExistAccountCPF,(request,response)=>{

    const { customer}=request;
    const amount = request.body.amount;
    const balance= getBalance(customer.statement);
    if(balance < amount){
        return response.status(400).json({error:"Insufficient founds"});
    }
    const statementOperation={
        amount,
        created_at:new Date(),
        type:"debit"

    }
    customer.statement.push(statementOperation);

    return response.status(200).send();



})

app.get('/statement/date',verifyIfExistAccountCPF,(request,response)=>{
    const {customer}=request;
    const { date }=request.query;
     
    const dateFormat= new Date(date + " 00:00");
    console.log(new Date(dateFormat).toDateString());
    const statement=customer.statement.filter(
        (statement)=>statement.created_at.toDateString() ===
        new Date(dateFormat).toDateString()
    );
    return response.json({statement});
})

app.put('/account',verifyIfExistAccountCPF,(request,response)=>{
    const { name }=request.body;
    const { customer }= request;
    customer.name=name;
    response.status(201).json({msg:"updated name"});
})

app.get('/accounts',(request,response)=>{

    response.status(200).json(customers);
})

app.get('/account',verifyIfExistAccountCPF,(request,response)=>{
    const { customer }= request;
    response.status(200).json(customer);
})

app.delete('/account',verifyIfExistAccountCPF,(request,response)=>{
    const { customer }= request;
    customers.splice(customer,1);
    response.status(200).json(customer);
})
 
app.get('/balance',verifyIfExistAccountCPF,(request,response)=>{
    const { customer }=request;
    const balance= getBalance(customer.statement);
    response.status(200).json(balance);
})
app.listen(3000);


