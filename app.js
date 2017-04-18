var authClient = new OktaAuth({ 
  url: 'https://dev-575570.oktapreview.com',
  clientId: 'tEuruSAwzA8P4ZYHGCDn',
  redirectUri: "http://localhost:8000"
});

var IdentityPoolId= "ap-southeast-2:13d455ec-d44e-4005-86cd-34ff808c92ec";
AWS.config.region = 'ap-southeast-2'; 

var cognitoidentity = new AWS.CognitoIdentity();

var oktaLogin = function() {

  var makeCognito = function(idToken) {
    var self = this;
      $("#cognitoInfo").toggle();
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IdentityPoolId,
      Logins: {
        "dev-575570.oktapreview.com": idToken
      }
    });

    AWS.config.credentials.get(function(err, data) {
     if (err) 
      console.log(err, err.stack); // an error occurred
     else {
     $("#cognitoIdentityId").html("<h3>Identity Id:</h3>" +AWS.config.credentials.data.IdentityId);
      $("#cognito").html('<h3>Credentials:</h3><pre><code class="json">' +JSON.stringify(AWS.config.credentials.data.Credentials, null, '  ') + '</code></pre>')


       var syncClient = new AWS.CognitoSyncManager();
       syncClient.openOrCreateDataset('okta', function(err, dataset) {
         console.log(err,dataset);

         var poo = {
           idToken: idToken
         }

      dataset.put('NewTokens', JSON.stringify(poo), (err,data)=>{
        console.log(err,data);
        dataset.synchronize({
          onSuccess: function(dataset, newRecords){
            console.log('done');
          },
          onDatasetDeleted: function(dataset, datasetName, callback) {

     // Return true to delete the local copy of the dataset.
     // Return false to handle deleted datasets outsid ethe synchronization callback.

     return callback(true);

  },
           onFailure: function(err) {
             console.log(err)
           }
        });
      });

    //     dataset.put('Token', self.idToken, function(err, record) {
    //     console.log(record);
    //     dataset.synchronize({
    //        onSuccess: function(dataset, newRecords){
    //          console.log(newRecords);
    //         dataset.get("Name",function(err, value) {
    //                 console.log(err,value);
    //                   });
    //        }

    //      })
    // });

         
         
       })
     }
    });

  }

  $("#loggedInState").text('Logging In....');

  authClient.signIn({
    username: 'test@test.com',
    password: 'ThisIsAPassword01!'
  })
  .then(function(transaction) { // On success
    var self = this;

    switch(transaction.status) {

      case 'SUCCESS':
          authClient.token.getWithoutPrompt({
            responseType: 'id_token',
            sessionToken: transaction.sessionToken,
            scopes: ['openid', 'email', 'profile','address', 'phone']
          })
          .then(function(token) {
            $("#oktaInfo").toggle();
            $("#loggedInState").text('Logged in to Ockta');
            $("#ocktaSessionToken").text(transaction.sessionToken);
            $("#ocktaIdToken").html('<pre><code class="json">' +JSON.stringify(token, null, '  ') + '</code></pre>');

            makeCognito(token.idToken);
            
          })
          .catch(function(err) {
            console.log(err);
          });        
        break;

        default:
          throw 'We cannot handle the ' + transaction.status + ' status';
    }
  })
  .fail(function(err) { // On failure
    console.error(err);
  });
}

 $( document ).ready(function() {
  
   if (!authClient.tx.exists()){
     $("#loggedInState").text('Not Logged In');
     oktaLogin();
   } else {   
    authClient.tx.resume();
   }
    
});
