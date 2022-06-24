import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import { withAuthenticator } from "aws-amplify-react-native";

import AmplifyClass, { Auth, DataStore, Hub } from "aws-amplify";
import awsmobile from "./src/aws-exports";
import { Message, User } from "./src/models";
import moment from "moment";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

AmplifyClass.configure(awsmobile);

function App() {
	const isLoadingComplete = useCachedResources();
	const colorScheme = useColorScheme();

	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		// Create listener
		const listener = Hub.listen("datastore", async (hubData) => {
			const { event, data } = hubData.payload;
			if (
				event === "outboxMutationProcessed" &&
				data.model === Message &&
				!["DELIVERED", "READ"].includes(data.element.status)
			) {
				// set to delivered
				DataStore.save(
					Message.copyOf(data.element, (updated) => {
						updated.status = "DELIVERED";
					})
				);
			}
		});

		// Remove listener
		return () => listener();
	}, []);

	useEffect(() => {
		if (!user) {
			return;
		}

		const subscription = DataStore.observe(User, user.id).subscribe((msg) => {
			if (msg.model === User && msg.opType === "UPDATE") {
				setUser(msg.element);
			}
		});

		return () => subscription.unsubscribe();
	}, [user?.id]);

	useEffect(() => {
		fetchUser();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			updateLastOnline();
		}, 1 * 60 * 1000);
		return () => clearInterval(interval);
	}, [user]);

	const fetchUser = async () => {
		const userData = await Auth.currentAuthenticatedUser();
		const user = await DataStore.query(User, userData.attributes.sub);
		if (user) {
			setUser(user);
		}
	};

	const updateLastOnline = async () => {
		if (!user) {
			return;
		}

		const response = await DataStore.save(
			User.copyOf(user, (updated) => {
				updated.LastOnlineAt = +new Date();
			})
		);
		setUser(response);
	};

	if (!isLoadingComplete) {
		return null;
	} else {
		return (
			<SafeAreaProvider>
				<ActionSheetProvider>
					<Navigation colorScheme={colorScheme} />
				</ActionSheetProvider>
			</SafeAreaProvider>
		);
	}
}

export default withAuthenticator(App);
