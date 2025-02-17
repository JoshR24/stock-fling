
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Check, X } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface FriendRequest {
  id: string;
  user: Friend;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function FriendsSection() {
  const [friendUsername, setFriendUsername] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  const loadFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        friend:profiles!friendships_friend_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
      return;
    }

    setFriends(data.map(f => f.friend));
  };

  const loadPendingRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user:profiles!friendships_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        ),
        status
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive",
      });
      return;
    }

    setPendingRequests(data);
  };

  const sendFriendRequest = async () => {
    if (!friendUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First find the user by username
    const { data: foundUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', friendUsername)
      .single();

    if (userError || !foundUser) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    // Send friend request
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: foundUser.id,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "Friend request already sent",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Success",
      description: "Friend request sent!",
    });
    setFriendUsername("");
  };

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase.rpc(
      'handle_friend_request',
      {
        friend_request_id: requestId,
        response: accept ? 'accepted' : 'rejected'
      }
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to handle friend request",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Friend request ${accept ? 'accepted' : 'rejected'}!`,
    });

    // Refresh lists
    loadFriends();
    loadPendingRequests();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5" />
        <span className="font-medium">Friends</span>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter username to add friend"
            value={friendUsername}
            onChange={(e) => setFriendUsername(e.target.value)}
          />
          <Button onClick={sendFriendRequest}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pending Requests</h3>
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span>{request.user.username}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFriendRequest(request.id, true)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleFriendRequest(request.id, false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {friends.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">My Friends</h3>
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span>{friend.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
