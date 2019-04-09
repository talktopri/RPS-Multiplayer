//set global variables
var player1 = null;
var player2 = null;
var player1Name = "";
var player2Name = "";
var yourPlayerName = "";
var player1Choice = "";
var player2Choice = "";
var turn = 1; //defaults to player1's turn
// Initialize Firebase
var config = {
    apiKey: "AIzaSyClxjW36tDOOhaugtkAXqM5FVc3I_1B65E",
    authDomain: "rockpapersscissors-homework.firebaseapp.com",
    databaseURL: "https://rockpapersscissors-homework.firebaseio.com",
    projectId: "rockpapersscissors-homework",
    storageBucket: "rockpapersscissors-homework.appspot.com",
    messagingSenderId: "96511678963"
  };
  firebase.initializeApp(config); // initializes the database
var database = firebase.database(); //creates a variable to hold the database

// Attach an event handler to the "Submit" button to add a new user to the database
$("#add-name").on("click", function(event) {
	event.preventDefault();

	// Make sure that the name field is non-empty and we are still waiting for a player
	if (($("#name-input").val().trim() !== "") && !(player1 && player2)) {
		if (player1 === null) {
			yourPlayerName = $("#name-input").val().trim();
			player1 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player1").set(player1);

			database.ref().child("/turn").set(1);
			$("#playerPanel2").animate({opacity: "0.3"});
			database.ref("/players/player1").onDisconnect().remove();
		} else if( (player1 !== null) && (player2 === null) ) {
			// Adding player2
			console.log("Adding Player 2");

			yourPlayerName = $("#name-input").val().trim();
			player2 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player2").set(player2);
			$("#playerPanel1").animate({opacity: "0.3"});
			database.ref("/players/player2").onDisconnect().remove();
		}
		$("#name-form").hide();
		var msg = yourPlayerName + " has joined the game!";
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
		$("#name-input").val("");	
	}
});

database.ref("/players/").on("value", function(snapshot) { //creates a /players directory 
  if (snapshot.child("player1").exists()) { //checks if player1 exists in the database
    player1 = snapshot.val().player1; //if so, the value of the database snapshot is assigned to player1
    player1Name = player1.name; //and we also assign player1 name

    $("#playerOneName").text(player1Name); //update the DOM with player1 info
    $("#player1Stats").html("Wins: " + player1.win + " | Losses: " + player1.loss + " | Ties: " + player1.tie)
  } else { //if player1 does not exist on the database, set it to null
		player1 = null;
		player1Name = "";

		$("#playerOneName").text("Waiting for Player 1"); //update the DOM
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
		$("#player1Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// Do the same thing for player2: Check if player2 exists in the database. If it does not, then update player2 display
	if (snapshot.child("player2").exists()) {

		player2 = snapshot.val().player2;
		player2Name = player2.name;

		$("#playerTwoName").text(player2Name);
		$("#player2Stats").html("Wins: " + player2.win + " | Losses: " + player2.loss + " | Ties: " + player2.tie);
	} else {
		player2 = null;
		player2Name = "";

		$("#playerTwoName").text("Waiting for Player 2");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
		$("#player2Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// If both players are now present, it's player1's turn
	if (player1 !== null && player2 !== null) {
		$("#playerPanel1").addClass("playerPanelTurn");
		$("#waitingNotice").html("Waiting for " + player1Name + " to choose...");
	}

	// If both players leave the game, empty the chat session
	if (player1 === null && player2 === null) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref("/outcome/").remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
	}
});

// Attach a listener that detects user disconnection events
database.ref("/players/").on("child_removed", function(snapshot) {
	var msg = snapshot.val().name + " has disconnected!";
	var chatKey = database.ref().child("/chat/").push().key;
	database.ref("/chat/" + chatKey).set(msg);
});

// Attach a listener to the database /chat/ node to listen for any new chat messages
database.ref("/chat/").on("child_added", function(snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	// Change the color of the chat message depending on user or connect/disconnect event
	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("chatColorDisconnected");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("chatColorJoined");
	} else if (chatMsg.startsWith(yourPlayerName)) {
		chatEntry.addClass("chatColor1");
	} else {
		chatEntry.addClass("chatColor2");
	}

	$("#chatDisplay").append(chatEntry);
	$("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

// Attach a listener to the database /turn/ node to listen for any changes
database.ref("/turn/").on("value", function(snapshot) {
	// Check if it's player1's turn
	if (snapshot.val() === 1) {
		turn = 1;

		// Update the display if both players are in the game
		if (player1 && player2) {
			$("#p1Rock").removeClass("playerSelectedOpt");
			$("#p1Paper").removeClass("playerSelectedOpt");
			$("#p1Scissors").removeClass("playerSelectedOpt");
			$("#playerPanel1").addClass("playerPanelTurn");
			$("#playerPanel2").removeClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
		}
	} else if (snapshot.val() === 2) {
		turn = 2;

		// Update the display if both players are in the game
		if (player1 && player2) {
			$("#p2Rock").removeClass("playerSelectedOpt");
			$("#p2Paper").removeClass("playerSelectedOpt");
			$("#p2Scissors").removeClass("playerSelectedOpt");
			$("#playerPanel1").removeClass("playerPanelTurn");
			$("#playerPanel2").addClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player2Name + " to choose...");
		}
	}
});

// Attach a listener to the database /outcome/ node to be notified of the game outcome
database.ref("/outcome/").on("value", function(snapshot) {
	$("#roundOutcome").html(snapshot.val());
});

// Attach an event handler to the chat "Send" button to append the new message to the conversation
$("#chat-send").on("click", function(event) {
	event.preventDefault();

	if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
		var msg = yourPlayerName + " says: " + $("#chat-input").val().trim();
		$("#chat-input").val("");
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
	}
});

// Monitor Player1's selection
$("#playerPanel1").on("click", ".panelOption", function(event) {
	event.preventDefault();
	if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1) ) {
		
		var choice = $(this).text().trim();
		if (choice === 'Rock'){
			$("#p1Rock").addClass("playerSelectedOpt");
		} else if (choice === 'Paper'){
			$("#p1Paper").addClass("playerSelectedOpt");
		}else if (choice === 'Scissors'){
			$("#p1Scissors").addClass("playerSelectedOpt");
		}

		
		player1Choice = choice;
		database.ref().child("/players/player1/choice").set(choice);
		turn = 2;
		database.ref().child("/turn").set(2);
	}
});

// Monitor Player2's selection
$("#playerPanel2").on("click", ".panelOption", function(event) {
	event.preventDefault();
	if (player1 && player2 && (yourPlayerName === player2.name) && (turn === 2) ) {

		var choice = $(this).text().trim();	
		if (choice === 'Rock'){
			$("#p2Rock").addClass("playerSelectedOpt");
		} else if (choice === 'Paper'){
			$("#p2Paper").addClass("playerSelectedOpt");
		}else if (choice === 'Scissors'){
			$("#p2Scissors").addClass("playerSelectedOpt");
		}

		player2Choice = choice;
		database.ref().child("/players/player2/choice").set(choice);
		gameLogic();
	}
});

// gameLogic is the main rock/paper/scissors logic to see which player wins
function gameLogic() {

	if (player1.choice === "Rock") {
		if (player2.choice === "Rock") {
			// Tie
			database.ref().child("/outcome/").set("It's a tie!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else if (player2.choice === "Paper") {
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else { // scissors
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
    }
  }  else if (player1.choice === "Paper") {
		if (player2.choice === "Rock") {
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else if (player2.choice === "Paper") {
			// Tie
			database.ref().child("/outcome/").set("It's a tie!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else { // Scissors
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		}

	} else if (player1.choice === "Scissors") {
		if (player2.choice === "Rock") {
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else if (player2.choice === "Paper") {
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else {
			// Tie
			database.ref().child("/outcome/").set("It's a tie!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		}
  }
  turn = 1;
	database.ref().child("/turn").set(1);
} 

