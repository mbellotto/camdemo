import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

import {IonContent,IonFab,IonFabButton,IonHeader,IonIcon, IonPage, IonTitle, IonToolbar} from '@ionic/react';
import { camera } from 'ionicons/icons';
import PhotoGallery from '../components/PhotoGallery';
import { usePhotoGallery } from '../hooks/usePhotoGallery';

const Home: React.FC = () => {
	const { photos, takePhoto, deletePhoto } = usePhotoGallery();

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Ionic Photo Gallery</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<PhotoGallery photos={photos} deletePhoto={deletePhoto} />

				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton onClick={() => takePhoto()}>
						<IonIcon icon={camera}></IonIcon>
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	);
};

export default Home;