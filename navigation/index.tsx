/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
	NavigationContainer,
	DefaultTheme,
	DarkTheme,
	useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import {
	ColorSchemeName,
	Pressable,
	Text,
	View,
	Image,
	useWindowDimensions,
} from "react-native";

import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import TabOneScreen from "../screens/HomeScreen";
import TabTwoScreen from "../screens/TabTwoScreen";

import ChatRoomScreen from "../screens/ChatRoomScreen";
import HomeScreen from "../screens/HomeScreen";
import UsersScreen from "../screens/UsersScreen";

import ChatRoomHeader from "./ChatRoomHeader";

import { Feather } from "@expo/vector-icons";

import {
	RootStackParamList,
	RootTabParamList,
	RootTabScreenProps,
} from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import GroupInfoScreen from "../screens/GroupInfoScreen";

export default function Navigation({
	colorScheme,
}: {
	colorScheme: ColorSchemeName;
}) {
	return (
		<NavigationContainer linking={LinkingConfiguration}>
			<RootNavigator />
		</NavigationContainer>
	);
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Home"
				component={HomeScreen}
				options={{ headerTitle: HomeHeader }}
			/>
			<Stack.Screen
				name="ChatRoom"
				component={ChatRoomScreen}
				options={({ route }) => ({
					headerTitle: () => <ChatRoomHeader id={route.params?.id} />,
					headerBackTitleVisible: false,
				})}
			/>
			<Stack.Screen
				name="GroupInfoScreen"
				component={GroupInfoScreen}
			/>
			<Stack.Screen
				name="UsersScreen"
				component={UsersScreen}
				options={{ title: "Contatos", headerBackTitleVisible: false }}
			/>
			<Stack.Screen
				name="NotFound"
				component={NotFoundScreen}
				options={{ title: "Oops!" }}
			/>
		</Stack.Navigator>
	);
}

const HomeHeader = (props) => {
	const { width } = useWindowDimensions();
	const navigation = useNavigation();

	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				width,
				padding: 10,
				alignItems: "center",
			}}
		>
			<Image
				source={{
					uri: "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/vadim.jpg",
				}}
				style={{ width: 30, height: 30, borderRadius: 30 }}
			/>
			<Text
				style={{
					flex: 1,
					textAlign: "center",
					marginLeft: 50,
					fontSize: 18,
					fontWeight: "bold",
				}}
			>
				{" "}
				Sinapse Chat{" "}
			</Text>
			<Feather
				name="camera"
				size={24}
				color="grey"
				style={{ marginHorizontal: 10 }}
			/>
			<Pressable onPress={() => navigation.navigate("UsersScreen")}>
				<Feather
					name="edit"
					size={24}
					color="grey"
					style={{ marginHorizontal: 10 }}
				/>
			</Pressable>
		</View>
	);
};

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
	const colorScheme = useColorScheme();

	return (
		<BottomTab.Navigator
			initialRouteName="TabOne"
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme].tint,
			}}
		>
			<BottomTab.Screen
				name="TabOne"
				component={TabOneScreen}
				options={({ navigation }: RootTabScreenProps<"TabOne">) => ({
					title: "Tab One",
					tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
					headerRight: () => (
						<Pressable
							style={({ pressed }) => ({
								opacity: pressed ? 0.5 : 1,
							})}
						>
							<FontAwesome
								name="info-circle"
								size={25}
								color={Colors[colorScheme].text}
								style={{ marginRight: 15 }}
							/>
						</Pressable>
					),
				})}
			/>
			<BottomTab.Screen
				name="TabTwo"
				component={TabTwoScreen}
				options={{
					title: "Tab Two",
					tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
				}}
			/>
		</BottomTab.Navigator>
	);
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
	name: React.ComponentProps<typeof FontAwesome>["name"];
	color: string;
}) {
	return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
