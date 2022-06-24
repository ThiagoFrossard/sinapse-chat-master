import { StyleSheet } from "react-native";


const styles = StyleSheet.create({

	container: {
    flexDirection: 'row',
    padding: 10,
  },
	image: {
		height: 60,
		width: 60,
    borderRadius: 30,
    marginRight: 10,
	},
  badgeContainer: {
    backgroundColor: '#3872e9',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 50,
    top: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row:{
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
	name: {
    fontWeight:'bold',
    fontSize: 18,
    marginBottom: 3,
  },
	text: {
		color: "grey",
	},
});


export default styles;