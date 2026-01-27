/**
 * Story 2.3.2: Team Collaboration UX
 * 
 * Shared dossier workspaces with role-based access,
 * team annotations, collaborative review workflows, and activity feeds
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Clock,
  CheckCircle,
  AtSign,
  Eye
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  lastActive: string;
}

interface Comment {
  id: string;
  author: TeamMember;
  content: string;
  timestamp: string;
  section?: string;
  mentions: string[];
}

interface ActivityItem {
  id: string;
  user: TeamMember;
  action: string;
  target: string;
  timestamp: string;
}

interface TeamCollaborationProps {
  dossierTitle: string;
  onShareDossier?: (members: string[]) => void;
}

export const TeamCollaboration: React.FC<TeamCollaborationProps> = ({ 
  dossierTitle,
  onShareDossier 
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'comments' | 'activity'>('team');
  const [newComment, setNewComment] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Mock data
  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'owner', lastActive: '2 min ago' },
    { id: '2', name: 'Mike Rodriguez', email: 'mike@company.com', role: 'editor', lastActive: '15 min ago' },
    { id: '3', name: 'Emma Wilson', email: 'emma@company.com', role: 'viewer', lastActive: '1 hour ago' }
  ];

  const comments: Comment[] = [
    {
      id: '1',
      author: teamMembers[0],
      content: 'The competitive analysis section looks great. @Mike can you verify the market share data?',
      timestamp: '10 min ago',
      section: 'Competitive Intelligence',
      mentions: ['Mike']
    },
    {
      id: '2',
      author: teamMembers[1],
      content: 'Verified ✓ All market data is current as of Q4 2025',
      timestamp: '5 min ago',
      section: 'Competitive Intelligence',
      mentions: []
    }
  ];

  const activities: ActivityItem[] = [
    { id: '1', user: teamMembers[0], action: 'shared dossier with', target: 'Mike Rodriguez', timestamp: '30 min ago' },
    { id: '2', user: teamMembers[1], action: 'reviewed', target: 'Competitive Intelligence section', timestamp: '20 min ago' },
    { id: '3', user: teamMembers[2], action: 'viewed', target: 'dossier', timestamp: '1 hour ago' }
  ];

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // Handle comment submission
    console.log('New comment:', newComment);
    setNewComment('');
  };

  return (
    <Card className="border-detective-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-detective-secondary" />
            Team Collaboration
          </div>
          <Button
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="bg-detective-primary hover:bg-detective-primary/90"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Dossier
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {(['team', 'comments', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-detective-primary text-detective-primary font-semibold'
                  : 'text-gray-600 hover:text-detective-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-detective-primary text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                    <span className="text-xs text-gray-500">{member.lastActive}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Comment Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment... Use @name to mention"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-detective-secondary text-white text-xs">
                            {comment.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.author.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    {comment.section && (
                      <Badge variant="secondary" className="text-xs">
                        {comment.section}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}
                    <span className="text-gray-600">{activity.action}</span>
                    {' '}
                    <span className="font-medium">{activity.target}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
