'use client';

import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { Button } from '@/components/ui/button';

const steps: Step[] = [
  {
    target: 'body',
    content:
      'Welcome to PrecisionPDF! This demo shows how our AI extracts structured data from PDF documents. Let me show you around.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="document-chunks"]',
    content:
      'This is the document viewer. Click on any section to view its extracted content. Hold Cmd (Mac) or Ctrl (Windows) while clicking to select multiple sections!',
    placement: 'right',
    disableScrolling: true,
  },
  {
    target: '[data-tour="parsed-content"]',
    content:
      'Selected content appears here. You can see the extracted text, tables, and structured data. Hold Cmd (Mac) or Ctrl (Windows) while clicking to select multiple sections!',
    placement: 'left',
    disableScrolling: true,
  },
  {
    target: '.export-controls',
    content:
      'Export your selected sections in various formats including Markdown, CSV, and Excel.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="download-all"]',
    content:
      "Or download the entire document's extracted content with one click.",
    placement: 'bottom',
  },
];

interface DemoTourProps {
  onComplete?: () => void;
}

export function DemoTour({ onComplete }: DemoTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Log component mount
  useEffect(() => {
    console.log('DemoTour component mounted');
  }, []);

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('demo-tour-completed');
    console.log('DemoTour: hasSeenTour =', hasSeenTour);

    // Auto-start tour on first visit after a longer delay to ensure DOM is ready
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        // Check if key elements exist before starting
        const documentChunks = document.querySelector(
          '[data-tour="document-chunks"]',
        );
        const parsedContent = document.querySelector(
          '[data-tour="parsed-content"]',
        );
        
        console.log('DemoTour: Looking for elements:', {
          documentChunks: !!documentChunks,
          parsedContent: !!parsedContent
        });

        if (documentChunks && parsedContent) {
          console.log('DemoTour: Starting tour');
          setRun(true);
        } else {
          // If elements not found, try again after another delay
          console.log('DemoTour: Elements not found, retrying in 1s');
          setTimeout(() => {
            console.log('DemoTour: Retry - starting tour anyway');
            setRun(true);
          }, 1000);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      // Mark tour as completed
      localStorage.setItem('demo-tour-completed', 'true');
      setRun(false);
      onComplete?.();
    } else if (type === 'step:after' && action === 'next') {
      // Move to next step
      setStepIndex(index + 1);
    } else if (type === 'step:after' && action === 'prev') {
      // Move to previous step
      setStepIndex(index - 1);
    } else if (action === 'close') {
      // User closed the tour
      setRun(false);
    }
  };

  const startTour = () => {
    // Clear the localStorage to allow tour to restart
    localStorage.removeItem('demo-tour-completed');
    setStepIndex(0);
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        scrollOffset={100}
        callback={handleJoyrideCallback}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks
        styles={{
          options: {
            primaryColor: '#3b82f6',
            textColor: '#374151',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            arrowColor: '#ffffff',
            width: 380,
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 20,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#6b7280',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Get Started!',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />

      {/* Tour trigger button */}
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={startTour}
          className="shadow-lg"
          data-tour="help-button"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Take a Tour
        </Button>
      </div>
    </>
  );
}