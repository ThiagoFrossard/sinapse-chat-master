import React, { useState, useEffect } from "react";
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Image,
	Text,
} from "react-native";
import {
	SimpleLineIcons,
	Feather,
	MaterialCommunityIcons,
	AntDesign,
	Ionicons,
} from "@expo/vector-icons";
import { DataStore } from "@aws-amplify/datastore";
import { Message } from "../../src/models";
import { Auth, Storage } from "aws-amplify";
import { ChatRoom } from "../../src/models";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker"
import EmojiSelector from "react-native-emoji-selector";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Audio, AVPlaybackStatus } from "expo-av";
import AudioPlayer from "../AudioPlayer";
import MessageComponent from "../Message/Message";

export default function MessageInput({ chatRoom, messageReplyTo, removeMessageReplyTo }) {
	const [message, setMessage] = useState("");
	const [isemojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
	const [image, setImage] = useState<string | null>(null);
	const [document, setDocument] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [soundURI, setSoundURI] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			if (Platform.OS !== "web") {
				const libraryResponse =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				const photoResponse = await ImagePicker.requestCameraPermissionsAsync();
				await Audio.requestPermissionsAsync();

				if (
					libraryResponse.status !== "granted" ||
					photoResponse.status !== "granted"
				) {
					alert(
						"Desculpe, precisamos de um rolo de câmera fazer isso funcionar !"
					);
				}
			}
		})();
	}, []);

	const sendMessage = async () => {
		// send message

		const user = await Auth.currentAuthenticatedUser();
		const newMessage = await DataStore.save(
			new Message({
				content: message,
				userID: user.attributes.sub,
				chatroomID: chatRoom.id,
				replyToMessageID: messageReplyTo?.id,
			})
		);

		updateLastMessage(newMessage);

		resetFields();
	};

	const sendDocument = async () => {
		// send document

		if (!document) {
			return;
		}

		const blob = await getBlob(document);
		const { key } = await Storage.put(`${uuidv4()}.pdf`, blob, {
			progressCallback,
		});

		const user = await Auth.currentAuthenticatedUser();
		const newMessage = await DataStore.save(
			new Message({
				content: message,
				document: key,
				userID: user.attributes.sub,
				chatroomID: chatRoom.id,
				replyToMessageID: messageReplyTo?.id,
			})
		);

		updateLastMessage(newMessage);
		resetFields();
	}

	const updateLastMessage = async (newMessage) => {
		DataStore.save(
			ChatRoom.copyOf(chatRoom, (updatedChatRoom) => {
				updatedChatRoom.LastMessage = newMessage;
				// console.log(updatedChatRoom)
				// console.log(chatRoom)
			})
		);
	};

	const onPlusClicked = () => {};

	const onPress = () => {
		if (image) {
			sendImage();
		} else if (soundURI) {
			sendAudio();
		} else if (document) {
			sendDocument();
		} else if (message) {
			sendMessage();
		} else {
			onPlusClicked();
		}
	};

	const resetFields = () => {
		setMessage("");
		setIsEmojiPickerOpen(false);
		setImage(null);
		setProgress(0);
		setSoundURI(null);
		setDocument(null);
		removeMessageReplyTo();
	};

	const pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.5,
		});

		console.log(result);

		if (!result.cancelled) {
			setImage(result.uri);
		}
	};

	const takePhoto = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			aspect: [4, 3],
		});

		if (!result.cancelled) {
			setImage(result.uri);
		}
	};

	const pickPDF = async () => {
		const res = await DocumentPicker.getDocumentAsync({
			type: "application/pdf" // for pdf, doc and docx
		});

		if(res.type == 'success'){
			setDocument(res.uri)
		}
	}

	const progressCallback = (progress) => {
		setProgress(progress.loaded / progress.total);
	};

	const sendImage = async () => {
		if (!image) {
			return;
		}

		const blob = await getBlob(image);
		const { key } = await Storage.put(`${uuidv4()}.png`, blob, {
			progressCallback,
		});

		const user = await Auth.currentAuthenticatedUser();
		const newMessage = await DataStore.save(
			new Message({
				content: message,
				image: key,
				userID: user.attributes.sub,
				chatroomID: chatRoom.id,
				replyToMessageID: messageReplyTo?.id,
			})
		);

		updateLastMessage(newMessage);
		resetFields();
	};

	const getBlob = async (uri: string) => {
		const response = await fetch(uri);
		const blob = await response.blob();
		return blob;
	};

	async function startRecording() {
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});
			console.log("Starting recording..");
			const { recording } = await Audio.Recording.createAsync(
				Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
			);
			setRecording(recording);
			console.log("Recording started");
		} catch (err) {
			console.error("Failed to start recording", err);
		}
	}

	async function stopRecording() {
		console.log("Stopping recording..");
		if (!recording) {
			return;
		}
		setRecording(null);
		await recording.stopAndUnloadAsync();
		await Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
		});
		const uri = recording.getURI();
		console.log("Recording stopped and stored at", uri);
		if (!uri) {
			return;
		}
		setSoundURI(uri);
	}

	const sendAudio = async () => {
		if (!soundURI) {
			return;
		}

		const uniParts = soundURI.split(".");
		const extension = uniParts[uniParts.length - 1];

		const blob = await getBlob(soundURI);
		const { key } = await Storage.put(`${uuidv4()}.${extension}`, blob, {
			progressCallback,
		});

		const user = await Auth.currentAuthenticatedUser();
		const newMessage = await DataStore.save(
			new Message({
				content: message,
				audio: key,
				userID: user.attributes.sub,
				chatroomID: chatRoom.id,
				status: 'SENT',
				replyToMessageID: messageReplyTo?.id,
			})
		);

		updateLastMessage(newMessage);
		resetFields();
	};

	return (
		<KeyboardAvoidingView
			style={[styles.root, { height: isemojiPickerOpen ? "50%" : "auto" }]}
			behavior={Platform.OS == "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			{messageReplyTo && (
				<View 
				style={{backgroundColor: '#f2f2f2', 
				padding: 5, 
				flexDirection: 'row',
				alignSelf:'stretch',
				justifyContent: 'space-between',
				}}>
					<View style={{ flex: 1 }}>
					<Text>Encaminhar para :</Text>
					<MessageComponent message={messageReplyTo}/>
					</View>
					<Pressable onPress={() => removeMessageReplyTo()}>
						<AntDesign
							name="close"
							size={24}
							color="black"
							style={{ margin: 5 }}
						/>
					</Pressable>
				</View>
			)}


			{image && (
				<View style={styles.sendImageContainer}>
					<Image
						source={{ uri: image }}
						style={{ width: 100, height: 100, borderRadius: 10 }}
					/>
					<View
						style={{
							flex: 1,
							justifyContent: "flex-start",
							alignSelf: "flex-end",
						}}
					>
						<View
							style={{
								height: 3,
								backgroundColor: "#3777f0",
								width: `${progress * 100}%`,
							}}
						></View>
					</View>

					<Pressable onPress={() => setImage(null)}>
						<AntDesign
							name="close"
							size={24}
							color="black"
							style={{ margin: 5 }}
						/>
					</Pressable>
				</View>
			)}

			{document && (
				<View style={styles.sendImageContainer}>
					<Image
						source={{ uri: 'https://th.bing.com/th/id/R.148ee6940b3beecb1fff34e6cf469749?rik=GWR9Noq2FBN%2fAQ&riu=http%3a%2f%2fopenclipart.org%2fimage%2f2400px%2fsvg_to_png%2f188817%2fpdf-icon.png&ehk=K9rMzs5XV05gVZYLAnpt4voQyEPeCOYZ4InDf9QI9Zg%3d&risl=&pid=ImgRaw&r=0' }}
						style={{ width: 100, height: 100, borderRadius: 10 }}
					/>
					<View
						style={{
							flex: 1,
							justifyContent: "flex-start",
							alignSelf: "flex-end",
						}}
					>
						<View
							style={{
								height: 3,
								backgroundColor: "#3777f0",
								width: `${progress * 100}%`,
							}}
						></View>
					</View>

					<Pressable onPress={() => setDocument(null)}>
						<AntDesign
							name="close"
							size={24}
							color="black"
							style={{ margin: 5 }}
						/>
					</Pressable>
				</View>
			)}	

			{soundURI && <AudioPlayer soundURI={soundURI} />}

			<View style={styles.row}>
				<View style={styles.inputContainer}>
					<Pressable
						onPress={() =>
							setIsEmojiPickerOpen((currentValue) => !currentValue)
						}
					>
						<SimpleLineIcons
							name="emotsmile"
							size={24}
							color="#595959"
							style={styles.icon}
						/>
					</Pressable>

					<TextInput
						style={styles.input}
						value={message}
						onChangeText={setMessage}
						placeholder="Digite sua mensagem..."
					/>

					<Pressable onPress={pickPDF}>
						<AntDesign name="file1" size={24} color="grey" style={styles.icon} />
					</Pressable>

					<Pressable onPress={pickImage}>
						<Feather name="image" size={24} color="grey" style={styles.icon} />
					</Pressable>

					<Pressable onPress={takePhoto}>
						<Feather name="camera" size={24} color="grey" style={styles.icon} />
					</Pressable>

					<Pressable onPressIn={startRecording} onPressOut={stopRecording}>
						<MaterialCommunityIcons
							name={recording ? "microphone" : "microphone-outline"}
							size={24}
							color={recording ? "red" : "#595959"}
							style={styles.icon}
						/>
					</Pressable>
				</View>
				<Pressable onPress={onPress} style={styles.buttonContainer}>
					{message || image || soundURI || document ? (
						<Ionicons name="send" size={18} color="white" />
					) : (
						<AntDesign name="plus" size={24} color="white" />
					)}
				</Pressable>
			</View>

			{isemojiPickerOpen && (
				<EmojiSelector
					onEmojiSelected={(emoji) =>
						setMessage((currentMessage) => currentMessage + emoji)
					}
					columns={9}
				/>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		padding: 10,
	},
	row: {
		flexDirection: "row",
	},
	inputContainer: {
		backgroundColor: "#f2f2f2",
		flex: 1,
		marginRight: 10,
		borderRadius: 25,
		borderWidth: 1,
		borderColor: "#dedede",
		alignItems: "center",
		flexDirection: "row",
		padding: 5,
	},
	input: {
		flex: 1,
		marginHorizontal: 5,
	},
	icon: {
		marginHorizontal: 5,
	},
	buttonContainer: {
		width: 40,
		height: 40,
		backgroundColor: "#3872e9",
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		color: "white",
		fontSize: 35,
	},
	sendImageContainer: {
		flexDirection: "row",
		marginVertical: 10,
		justifyContent: "space-between",
		alignSelf: "stretch",
		borderWidth: 1,
		borderColor: "lightgray",
		borderRadius: 10,
	},
});