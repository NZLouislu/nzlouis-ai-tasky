/**
 * Format Conversion Preview Component
 * Shows side-by-side comparison of Markdown vs Platform format
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { markdownToADF, adfToJson } from '@/lib/stories/converters/markdown-to-adf';
import { markdownToTrello, parseStoryToTrelloCard } from '@/lib/stories/converters/markdown-to-trello';

interface FormatPreviewProps {
  markdown: string;
  platform: 'jira' | 'trello';
  isVisible: boolean;
  onToggle: () => void;
}

export function FormatPreview({ markdown, platform, isVisible, onToggle }: FormatPreviewProps) {
  const [convertedContent, setConvertedContent] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    if (!markdown.trim()) {
      setConvertedContent('');
      setWarnings([]);
      setCharacterCount(0);
      return;
    }

    try {
      let converted = '';
      const newWarnings: string[] = [];

      if (platform === 'jira') {
        const adf = markdownToADF(markdown);
        converted = adfToJson(adf);
        
        // Check for unsupported features
        if (markdown.includes('~~')) {
          newWarnings.push('Strikethrough text may not render correctly in Jira');
        }
        if (markdown.includes('<u>')) {
          newWarnings.push('Underlined text may not render correctly in Jira');
        }
        if (markdown.match(/!\[.*?\]\(.*?\)/)) {
          newWarnings.push('Images need to be uploaded separately to Jira');
        }
      } else {
        const trelloCard = parseStoryToTrelloCard(markdown);
        converted = JSON.stringify(trelloCard, null, 2);
        
        // Check for Trello-specific warnings
        if (markdown.length > 16384) {
          newWarnings.push('Content exceeds Trello card description limit (16,384 characters)');
        }
        if (markdown.includes('```') && markdown.split('```').length > 3) {
          newWarnings.push('Multiple code blocks may not format correctly in Trello');
        }
      }

      setConvertedContent(converted);
      setWarnings(newWarnings);
      setCharacterCount(converted.length);
    } catch (error) {
      setConvertedContent(`Error converting content: ${error}`);
      setWarnings(['Conversion failed']);
      setCharacterCount(0);
    }
  }, [markdown, platform]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
     onClick={onToggle}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        Preview {platform === 'jira' ? 'Jira ADF' : 'Trello Format'}
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Format Preview - {platform === 'jira' ? 'Jira ADF' : 'Trello Format'}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Character count and limits */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Characters: {characterCount.toLocaleString()}</span>
          {platform === 'trello' && (
            <Badge variant={characterCount > 16384 ? 'destructive' : 'secondary'}>
              Limit: 16,384
            </Badge>
          )}
        </div>

        {/* Preview tabs */}
        <Tabs defaultValue="formatted" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formatted">Formatted View</TabsTrigger>
            <TabsTrigger value="raw">Raw {platform === 'jira' ? 'ADF' : 'JSON'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="formatted" className="mt-4">
            <div className="border rounded-md p-4 bg-gray-50 min-h-[200px]">
              {platform === 'jira' ? (
                <JiraPreview content={convertedContent} />
              ) : (
                <TrelloPreview content={convertedContent} />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="mt-4">
            <pre className="border rounded-md p-4 bg-gray-50 text-xs overflow-auto max-h-[400px]">
              {convertedContent}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function JiraPreview({ content }: { content: string }) {
  try {
    const adf = JSON.parse(content);
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-blue-700 mb-2">
          Jira ADF Preview (Simplified)
        </div>
        {adf.content?.map((node: any, index: number) => (
          <JiraNodePreview key={index} node={node} />
        ))}
      </div>
    );
  } catch {
    return <div className="text-red-600">Invalid ADF format</div>;
  }
}

function JiraNodePreview({ node }: { node: any }) {
  switch (node.type) {
    case 'heading':
      const HeadingTag = `h${Math.min(node.attrs?.level || 1, 6)}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag className="font-bold text-gray-900 mb-2">
          {node.content?.[0]?.text || ''}
        </HeadingTag>
      );
    
    case 'paragraph':
      return (
        <p className="text-gray-800 mb-2">
          {node.content?.map((textNode: any, i: number) => (
            <span key={i} className={getTextStyles(textNode.marks)}>
              {textNode.text}
            </span>
          ))}
        </p>
      );
    
    case 'codeBlock':
      return (
        <pre className="bg-gray-100 border rounded p-2 text-sm font-mono">
          {node.content?.[0]?.text || ''}
        </pre>
      );
    
    case 'bulletList':
      return (
        <ul className="list-disc list-inside space-y-1 ml-4">
          {node.content?.map((item: any, i: number) => (
            <li key={i} className="text-gray-800">
              {item.content?.[0]?.content?.[0]?.text || ''}
            </li>
          ))}
        </ul>
      );
    
    default:
      return <div className="text-gray-600">Unsupported content type: {node.type}</div>;
  }
}

function TrelloPreview({ content }: { content: string }) {
  try {
    const card = JSON.parse(content);
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-blue-700 mb-2">
          Trello Card Preview
        </div>
        
        {/* Card title */}
        <div className="font-semibold text-lg text-gray-900">
          {card.name}
        </div>
        
        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((label: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Description */}
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-800">
            {card.desc}
          </div>
        </div>
        
        {/* Checklists */}
        {card.checklists && card.checklists.length > 0 && (
          <div className="space-y-2">
            {card.checklists.map((checklist: any, i: number) => (
              <div key={i} className="border rounded p-2">
                <div className="font-medium text-sm mb-2">{checklist.name}</div>
                <div className="space-y-1">
                  {checklist.items.map((item: any, j: number) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                        className="rounded"
                      />
                      <span className={item.checked ? 'line-through text-gray-500' : ''}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <div className="text-red-600">Invalid Trello format</div>;
  }
}

function getTextStyles(marks?: any[]): string {
  if (!marks) return '';
  
  const classes: string[] = [];
  
  for (const mark of marks) {
    switch (mark.type) {
      case 'strong':
        classes.push('font-bold');
        break;
      case 'em':
        classes.push('italic');
        break;
      case 'code':
        classes.push('bg-gray-100 px-1 rounded font-mono text-sm');
        break;
      case 'link':
        classes.push('text-blue-600 underline');
        break;
    }
  }
  
  return classes.join(' ');
}