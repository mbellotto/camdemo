import { useState, useEffect } from 'react';
import { isPlatform } from '@ionic/react';
import { Camera, CameraResultType, CameraSource, Photo as CameraPhoto } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Photo } from '../types/Photos';


const PHOTOS_PREF_KEY = 'photos';

export const usePhotoGallery = () => {
	const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        Preferences.set({ key: PHOTOS_PREF_KEY, value: JSON.stringify(photos) });
    }, [photos]);
    
    useEffect(() => {
        const loadSaved = async () => {
            const { value } = await Preferences.get({ key: PHOTOS_PREF_KEY });
            const photosInPreferences: Photo[] = value ? JSON.parse(value) : [];
    
            if (!isPlatform('hybrid')) {
                for (let photo of photosInPreferences) {
                    const file = await Filesystem.readFile({
                        path: photo.filePath,
                        directory: Directory.Data
                    });
    
                    photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
                }
            }
    
            setPhotos(photosInPreferences);
        };
    
        loadSaved();
    }, []);

    const takePhoto = async () => {
        try {
            const photo: CameraPhoto = await Camera.getPhoto({
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
                quality: 100
            });
    
            const fileName = new Date().getTime() + '.jpeg';
            const savedFileImage = await savePhoto(photo, fileName);
    
            const newPhotos = [...photos, savedFileImage];
            setPhotos(newPhotos);
        } catch (e) {
            return;
        }
    };
    
    const savePhoto = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
        let base64Data: any;
    
        if (isPlatform('hybrid')) {
            const file = await Filesystem.readFile({
                path: photo.path!
            });
            base64Data = file.data;
        } else {
            base64Data = await base64FromPath(photo.webPath!);
        }
    
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data
        });
    
        if (isPlatform('hybrid')) {
            return {
                filePath: savedFile.uri,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri)
            };
        }
    
        return {
            filePath: fileName,
            webviewPath: photo.webPath
        };
    };

    const uploadPhoto = async (photo: CameraPhoto, fileName: string): Promise<any> => {

        try { 
            const blob = await fetch(photo.path!).then(res => res.blob());
            const formData = new FormData();
            formData.append('image', blob, fileName);
            const response = await fetch('http://139.144.31.100:3504/api/v1/checklist/upload', { 
                method: 'POST', 
                body: formData 
            });
            const data = await response.json();
            console.log('Upload successful:', data);
            return data.file;
        } catch (error) { 
            console.error('Error uploading image:', error); 
        }
    }
    
    async function base64FromPath(path: string): Promise<string> {
        const response = await fetch(path);
        const blob = await response.blob();
    
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject('method did not return a string');
                }
            };
    
            reader.readAsDataURL(blob);
        });
    }
    
    const deletePhoto = async (fileName: string) => {
        setPhotos(photos.filter((photo) => photo.filePath !== fileName));
        await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Data
        });
    };
    
	return {
		photos,
		takePhoto,
		deletePhoto
	};
};


