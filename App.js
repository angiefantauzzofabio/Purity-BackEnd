import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ImageBackground, requireNativeComponent } from 'react-native';
import aqiCalculator from "aqi-calculator"; 

import * as firebase from 'firebase';  
import "firebase/firestore";
import {decode, encode} from 'base-64'

if (!global.btoa) {  global.btoa = encode }

if (!global.atob) { global.atob = decode }


  // Your web app's Firebase configuration
  const firebaseConfig = {
   
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();


export default class App extends React.Component{

  constructor(props){
    super (props)
    
    this.state = ({

      email:'',
      password:'',
      nombrecompleto:'',
      direccion:'',
      newPassword:'',
      nuevaDir:'',
      confirmarPassword:''
    })
  }

  SingUpUser = (email, password, nombrecompleto, direccion ) =>{ 
    if (!email || !password || !nombrecompleto || !direccion){
      Alert.alert ('Complete todos los campos')
    }
    else {
   
    firebase.auth().createUserWithEmailAndPassword(email,  password).then(function (user){
      console.log(user)
      console.log("se ha creado la cuenta")
      var user = firebase.auth().currentUser; 
      var uid; 
      uid =  user.uid;
      console.log("el uid de usuario es " + uid)
      db.collection('usuarios').doc(uid).set({
        nombre: direccion,
        email: email,
        direccion: nombrecompleto,
        verificacion: user.emailVerified
      })
      user.sendEmailVerification();
      user.reload()
    
      Alert.alert ("Se ha creado la cuenta, pero recuerde entrar a su mail y verificar su cuenta. En caso de no hacerlo no podra iniciar sesion.") 
    })
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode == 'auth/weak-password') {
       Alert.alert('Contrasenia muy debil');
      } else {
        alert(errorMessage);
      }
      console.log(error);
    });
  
  }
}


SingIn = (email, password) =>{
 
    firebase.auth().signInWithEmailAndPassword(email, password).then(function (user){
      
        firebase.auth().onAuthStateChanged(function(user){
          if (user){
            
            if (!user.emailVerified)
            {
              Alert.alert('Verifique su cuenta, si no lo hace no podra iniciar sesion')
              console.log("Verifique su  cuenta")
              firebase.auth().signOut();
            }
            else
            {
              console.log(user)
              console.log("ha iniciado sesion")
              Alert.alert ("Se ha iniciado sesion"); 
              db.collection("usuarios").doc(user.uid).update({
                verificacion: true
              })
            }
          }
        })
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        alert('Contraseña incorrecta');
      } else {
        alert(errorMessage);
      }
      console.log(error);
    });


}


SingOut = ()=>{
  try {
    firebase.auth().signOut();
    console.log("se cerro sesion")
    Alert.alert ("Se ha cerrado la sesion")
  } 
  catch (error) {
    console.log(error.toString())
  }
}

DeleteAccount = () =>{
  var user = firebase.auth().currentUser;
  var uid = user.uid;
  console.log ("el uid es " + uid)

  db.collection("usuarios").doc(uid).delete().then(function() {
    console.log("se borro la cuenta")
    Alert.alert ('Se ha borrado su cuenta')
    user.delete().then(function() {
    })
    .catch(function(error) {
      console.log (error.toString())
    })

  })
  .catch(function(error) {
      console.error(error)
  })
}

CambiarDireccion = (nuevaDir) =>{
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      db.collection("usuarios").doc(user.uid).update({
        direccion: nuevaDir
      })
      console.log("se ha cambiado la direccion")
      Alert.alert('Se ha cambiado la direccion')
    } else {
      
    }
  })
}

ReAuth = (password) =>{
  var user = firebase.auth().currentUser;
  var credentials = firebase.auth.EmailAuthProvider.credential(user.email, password)
  return user.reauthenticateWithCredential(credentials);
}


ChangePassword = (newPassword, confirmarPassword) =>{

  this.ReAuth(this.state.password).then(() =>{
    
    var user = firebase.auth().currentUser;
    if (this.state.newPassword == this.state.confirmarPassword){
      user.updatePassword(this.state.newPassword).then(function() {
        Alert.alert ('Se ha cambiado la contraseña')
        console.log ('se ha cambiado la contraseña')
      })
      .catch(function(error) {
        console.error(error)
      })
    }
    else{
      Alert.alert("Las contraseñas no coinciden"); 
    }

  })
  .catch((error) => {
    Alert.alert(error)
  })

}

DatosUsuario = () =>{
  var user = firebase.auth().currentUser;
  var uid = user.uid; 
  var docRef = db.collection("usuarios").doc(uid);
  docRef.get().then(function(doc) {
    if (doc.exists){
      console.log(uid);
      var email = doc.get("email"); 
      var nombre = doc.get("nombre")
      console.log("Document data:", email);
      console.log("Document data:", nombre);
    }
    else{
      console.log("no existe documento"); 
    }
  })
}
DirrecionUsuario = () =>{
  var user = firebase.auth().currentUser;
  var uid = user.uid; 
  var docRef = db.collection("usuarios").doc(uid);
  docRef.get().then(function(doc) {
    if (doc.exists){
      console.log(uid);
      console.log("Document data:", doc.get("direccion"));
    }
    else{
      console.log("no existe documento"); 
    }
  })
}

DatosFirebase = (direccion) =>{
  direccion = 'marconi 1157';
  console.log(direccion); 
  let query = db.collection('mediciones').where('direccion', '==', direccion).get()
  .then(snapshot => {
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }

    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
      var par = doc.get("particulas");
      var nitrogeno = doc.get("oxidos de nitrogeno")
      var carbono = doc.get("monoxido de carbono")
      var AQI; 
      const DATA = [
        {
          //datetime: "2020-03-27T13:00:00.000Z", //Taking the 24-hour average concentration  - change when you use this example
          pm25: par,
          pm10: par,
          so2: null,
          no: null,
          nox: nitrogeno,
          no2: null,
          o3: null,
          co: carbono,
        }
      ];
        var AQI = aqiCalculator(DATA);
        console.log(AQI);
      
    });
  })
  .catch(err => {
    console.log('Error getting documents', err);
  });
}


/*    <TouchableOpacity 
style={styles.buttom}
onPress={() => this.DatosUsuario()} 
>
  <Text style={styles.btntext}>DATOS</Text>
</TouchableOpacity>*/

  render(){
    return(
    
      
      <ImageBackground source= {require('./assets/Abstract.jpg')} style={styles.backgroundimage}>
      <View style={styles.container}>
      <TextInput style={styles.textinput} placeholder = "YOUR EMAIL" underlineColorAndroid= {'transparent'}
         onChangeText={email => this.setState({ email })}
         value={this.state.email}
      />

      <TextInput style={styles.textinput} placeholder = "PASSWORD" secureTextEntery ={true} underlineColorAndroid= {'transparent'}
        onChangeText={password => this.setState({ password })}
        value={this.state.password}
      />

     <TextInput style={styles.textinput} placeholder = "NOMBRE COMPLETO" underlineColorAndroid= {'transparent'}
        onChangeText={nombrecompleto => this.setState({ nombrecompleto })}
        value={this.state.nombrecompleto}
      />

      <TextInput style={styles.textinput} placeholder = "UBICACION DE TU CASA"underlineColorAndroid= {'transparent'}
        onChangeText={direccion => this.setState({ direccion })}
        value={this.state.direccion}
      />

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.SingUpUser(this.state.email, this.state.password, this.state.direccion, this.state.nombrecompleto)}
    >
        <Text style={styles.btntext}>SING UP</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.SingIn(this.state.email, this.state.password)}
    >
        <Text style={styles.btntext}>LOGIN</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.SingOut()} 
    >
        <Text style={styles.btntext}>SING OUT</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.DeleteAccount()} 
    >
        <Text style={styles.btntext}>DELETE ACCOUNT</Text>
    </TouchableOpacity>


    <TextInput style={styles.textinput} placeholder = "NUEVA UBICACION"underlineColorAndroid= {'transparent'}
        onChangeText={nuevaDir => this.setState({ nuevaDir })}
        value={this.state.nuevaDir}
    />

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.CambiarDireccion(this.state.nuevaDir)} 
    >
        <Text style={styles.btntext}>CAMBIAR UBICACION</Text>
    </TouchableOpacity>


    <TextInput style={styles.textinput} placeholder = "NUEVA CONTRASEÑA"underlineColorAndroid= {'transparent'}
        onChangeText={ newPassword => this.setState({ newPassword })}
        value={this.state.newPassword}
    />

    <TextInput style={styles.textinput} placeholder = "CONFIRMAR CONTRASEÑA"underlineColorAndroid= {'transparent'}
        onChangeText={ confirmarPassword => this.setState({ confirmarPassword })}
        value={this.state.confirmarPassword}
    />

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.ChangePassword(this.state.newPassword)} 
    >
        <Text style={styles.btntext}>CAMBIAR CONTRASEÑA</Text>
    </TouchableOpacity>

    

    <TouchableOpacity 
      style={styles.buttom}
      onPress={() => this.DatosFirebase(this.state.direccion)} 
    >
        <Text style={styles.btntext}>AGARRAR DATOS</Text>
    </TouchableOpacity>

    </View>
    </ImageBackground>
    

      
    
    
    )
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regform: {
    alignSelf: 'stretch',
  },
  header: {
    fontSize: 20,
    color: '#fff',
    paddingBottom: 8,
    marginBottom: 30,
    borderBottomColor: '#199187',
    borderBottomWidth: 1,
  },
  textinput: {
    alignSelf: 'stretch',
    height: 30,
    marginBottom: 20,
    borderBottomColor: '#f8f8f8',
    borderBottomWidth: 1,
  },
  buttom: {
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#59cbbd'
  },
  btntext: {
    color: '#fff'
  },
  backgroundimage:{
    width : "100%",
    flex: 1
  }
});

