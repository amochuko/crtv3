'use client';
import { fullLivepeer } from '@app/lib/sdk/livepeer/fullClient';
import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import { BiCloud, BiMusic, BiPlus } from 'react-icons/bi';
import {
  NewAssetFromUrlPayload,
  NewAssetPayload,
} from 'livepeer/models/components';
import { useActiveAccount } from 'thirdweb/react';
import { client } from '@app/lib/sdk/thirdweb/client';
import { Input } from '@app/components/ui/input';
import {
  Type,
  TranscodeProfileProfile,
  TranscodeProfileEncoder,
} from 'livepeer/models/components';
import {
  AssetData,
  AssetType,
  CreatorIdType,
  PlaybackPolicyType,
  SourceType,
} from '@app/lib/types';
import { polygon } from 'thirdweb/chains';
import { upload } from 'thirdweb/storage';
import {
  deploySplitContract,
  prepareDeterministicDeployTransaction,
  deployERC1155Contract,
} from 'thirdweb/deploys';
import { ACCOUNT_FACTORY_ADDRESS } from '@app/lib/utils/context';
import { toast } from 'sonner'; // Add this import for error notifications
import FileUpload from './FileUpload';
import PreviewVideo from './PreviewVideo';
import { createAsset, createViaUrl } from '@app/api/livepeer/actions'; // Import the createAsset function

import { useForm } from 'react-hook-form';

type TNewFormType = {
  title: string;
  description: string;
  location: string;
  category: string;
};

export default function Upload() {
  // Creating state for the input field
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [thumbnail, setThumbnail] = useState<File | string>('');
  const [video, setVideo] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [assetData, setAssetData] = useState<AssetData>({
    name: '',
    description: '',
    id: '',
  });
  const [videoUrl, setVideoUrl] = useState<string>(''); // Add this line to define videoUrl state

  //  Creating a ref for thumbnail and video
  const thumbnailRef = useRef();
  const videoRef = useRef<HTMLInputElement | null>(null); // Create a ref for the video input

  const chain = polygon;
  const activeAccount = useActiveAccount();
  const goBack = () => {
    window.history.back();
  };

  const form = useForm<TNewFormType>({
    mode: 'onChange',
  });

  const uploadVideo = async (payload: NewAssetFromUrlPayload) => {
    const response = await fetch(payload.url, {
      method: 'Post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to upload video');
    }

    return response.url; // This should return the URL of the uploaded video
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Step 1: Request the upload URL
      // const uploadData = fullLivepeer.asset;
      // const uploadUrlResponse = await uploadData.createViaUrl({
      //   // Await the promise to get the actual upload URL
      //   name: videoFile?.name || '',
      //   staticMp4: true,
      //   playbackPolicy: {
      //     type: Type.Webhook,
      //     webhookId: '1bde4o2i6xycudoy',
      //     webhookContext: {
      //       streamerId: 'my-custom-id',
      //     },
      //     refreshInterval: 600,
      //   },
      //   url: videoUrl,
      //   profiles: [
      //     {
      //       width: 1280,
      //       name: '720p',
      //       height: 720,
      //       bitrate: 3000000,
      //       quality: 23,
      //       fps: 30,
      //       fpsDen: 1,
      //       gop: '2',
      //       profile: TranscodeProfileProfile.H264Baseline,
      //       encoder: TranscodeProfileEncoder.H264,
      //     },
      //   ],
      // });

      // const uploadUrlResponse = createViaUrl({
      //   name: videoFile?.name || '',
      //   url: videoUrl,
      // });

      if (videoFile && videoUrl) {
        // Check if videoFile is not null
        const uploadedVideoUrl = await uploadVideo({
          name: title,
          url: videoUrl,
        });
        setVideoUrl(uploadedVideoUrl);

        // Step 3: Create the asset using the createAsset function
        const assetData = {
          name: title,
          description,
          video: videoFile, // Use the URL of the uploaded video
          // Add other necessary fields based on your Asset type
        };

        console.log('Video url', videoUrl);
        // const createdAsset = await createLivepeerAsset(assetData);
        // console.log('Created asset:', createdAsset);

        // Handle successful submission
        toast.success('Video uploaded and asset created successfully!');
      } else {
        throw new Error('No video file selected'); // Handle the case where videoFile is null
      }
    } catch (error) {
      console.error('Error submitting video:', error);
      toast.error('Failed to upload video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    if (!videoFile && !videoUrl) {
      // Change this line
      toast.error('Please upload a video');
      return false;
    }
    // Add more validation as needed
    return true;
  };

  const getSplits = async (collabs: string[], shares: bigint[]) => {
    const splits = await deploySplitContract({
      chain: chain,
      client,
      account: activeAccount,
      params: {
        name: 'Split Contract',
        payees: [activeAccount?.address, ...collabs],
        shares: [1000n, ...shares],
      },
    });
    console.log('splits', splits);
    return splits;
  };

  const determineVideoAddress = async () => {
    const tx = prepareDeterministicDeployTransaction({
      client,
      chain: chain,
      contractId: ACCOUNT_FACTORY_ADDRESS.polygon,
      constructorParams: [],
    });
    console.log('tx', tx);
    return tx;
  };

  const generateVideoNFT = async (
    description: string,
    name: string,
    image: string,
  ) => {
    const videoNFT = await deployERC1155Contract({
      chain: chain,
      client: client,
      account: activeAccount,
      type: 'DropERC1155',
      params: {
        name: name,
        image: image,
        description: description,
        symbol: 'CRTVV',
      },
    });
    console.log('videoNFT', videoNFT);
    return videoNFT;
  };

  const handleCancelVideo = () => {
    setVideoFile(null); // Clear the video file
    setVideoUrl(''); // Clear the video URL
  };

  const { handleSubmit: reactUseFormHandleSubmit, register } = form;
  const onFormSubmitCallback = async (data: TNewFormType) => {
    // This is where the form data submit happens - do server interactions, send data where you need to
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex justify-end">
        <div className="flex items-center">
          <button
            className="mr-4 rounded-lg border border-[#EC407A] bg-transparent px-4 py-2 text-[#EC407A] hover:border-[#A6335A] hover:text-[#A6335A] focus:border-[#A6335A] focus:text-[#A6335A]"
            onClick={goBack}
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || isSubmitting}
            className="flex items-center rounded-lg bg-[#EC407A] px-4 py-2 text-white hover:bg-[#A6335A] focus:bg-[#A6335A] disabled:opacity-50"
          >
            {isSubmitting ? (
              'Uploading...'
            ) : (
              <>
                <BiCloud className="mr-2" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>

      <form
        onSubmit={reactUseFormHandleSubmit(onFormSubmitCallback)}
        className="flex flex-col lg:flex-row"
      >
        <div className="flex w-full flex-col p-4 lg:w-1/2"></div>

        <div className="mx-auto flex w-full flex-col items-center justify-center pl-4 lg:w-1/2">
          <div
            onClick={() => {
              videoRef?.current;
            }}
            className={`flex h-auto w-full items-center justify-center rounded-md ${videoFile ? '' : 'border-2 border-dashed border-gray-600'}`}
          >
            {/* hide element once videoUrl is available */}
            <div className="">
              <FileUpload
                onFileSelect={(file) => {
                  console.log('Selected file:', file); // Debugging line
                  setVideoFile(file);
                }}
                onFileUploaded={(videoUrl: string) => {
                  console.log('Uploaded video URL:', videoUrl); // Debugging line
                  setVideoUrl(videoUrl);
                }}
              />
            </div>
          </div>
          {videoFile && <PreviewVideo video={videoFile} />}
        </div>
        <button type="submit">Submit form</button>
      </form>

      <Input
        type="file"
        className="hidden"
        accept="video/*"
        ref={videoRef}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) {
            console.log('Selected video file:', file); // Debugging line
            setVideoFile(file);
          }
        }}
      />
    </div>
  );
}
