import React, { Component } from 'react';
import update from 'immutability-helper';
import Infinite from 'react-infinite';
import firebase from 'firebase/app';
import _findIndex from 'lodash/fp/findIndex';

function EntryListItem({
	id,
	timestamp,
	weight,
	waist,
	chest,
	hips,
	bf,
	remove
}) {
	return (
		<div className="box">
			<div className="level is-mobile">
				<div className="level-left">
					<div>
						<h1 className="title is-5">
							{timestamp.toDateString()}
						</h1>
						<div>Weight: {weight}</div>
						<div>Waist: {waist}</div>
						<div>Chest: {chest}</div>
						<div>Hips: {hips}</div>
						<div>Bodyfat: {bf}</div>
					</div>
				</div>
				<div className="level-right">
					<button
						className="button is-danger is-outlined"
						onClick={() => {
							remove(id);
						}}
					>
						Remove
					</button>
				</div>
			</div>
		</div>
	);
}

export default class History extends Component {
	state = {
		entries: null
	};
	async componentDidMount() {
		await new Promise((resolve, reject) => {
			firebase.auth().onAuthStateChanged(({ uid }) => {
				if (uid) {
					resolve();
				}
			});
		});
		this.loadEntries();
	}
	render() {
		const { entries } = this.state;
		const entrylistItems = entries
			? entries.map(e => (
					<EntryListItem
						remove={this.removeEntry}
						key={e.id}
						{...e}
					/>
				))
			: [];
		return (
			entries && (
				<section className="section">
					<div className="container">
						<Infinite
							useWindowAsScrollContainer={true}
							elementHeight={136}
						>
							{entrylistItems}
						</Infinite>
						{entries.length < 1 && (
							<div className="box">
								No entries yet. Add one to get started.
							</div>
						)}
					</div>
				</section>
			)
		);
	}
	// Need to add paging, seems like there's a bug in firestore for paging on a timestamp
	loadEntries = async () => {
		const { uid } = firebase.auth().currentUser;

		const querySnapshot = await firebase
			.firestore()
			.collection(`users/${uid}/entries`)
			.orderBy('timestamp', 'desc')
			.get()
			.catch(err => console.error(err));

		const entries = querySnapshot.docs.map(d =>
			Object.assign(d.data(), { id: d.id })
		);
		this.lastEntry = querySnapshot.docs[querySnapshot.docs.length - 1];
		this.setState({ entries });
	};
	removeEntry = async entryId => {
		const { entries } = this.state;
		const index = _findIndex(e => e.id == entryId)(entries);
		this.setState(prevState =>
			update(prevState, {
				entries: { $splice: [[index, 1]] }
			})
		);
		const { uid } = firebase.auth().currentUser;
		await firebase
			.firestore()
			.doc(`users/${uid}/entries/${entryId}`)
			.delete();
	};
}
