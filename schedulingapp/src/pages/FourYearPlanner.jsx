import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { keyframes } from "@mui/system";
import { useWebSocket } from "../hooks/useWebSocket";
import PlanTabs from "../components/PlanTabs";
import YearCourses from "../components/YearCourses";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
`;

const classSchedules = {
  "Intro to Statistics": { period: 1 },
  "AP Calculus AB": { period: 1 },
  "AP HUG": { period: 3 },
  "AP Physics": { period: 2 },
  "AP Chem": { period: 2 },
  "American Literature": { period: 4 },
};
const defaultYears = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];

const conflictDetection = (plan) => {
  const conflicts = [];

  Object.entries(plan.years).forEach(([grade, courses]) => {
    if (courses.length === 0) return;

    const periodMap = {};

    courses.forEach((courseName) => {
      const schedule = classSchedules[courseName];
      if (!schedule) return;

      const period = schedule.period;
      if (!periodMap[period]) {
        periodMap[period] = [];
      }
      periodMap[period].push(courseName);
    });

    Object.entries(periodMap).forEach(([period, coursesInPeriod]) => {
      if (coursesInPeriod.length > 1) {
        conflicts.push({
          type: "time_conflict",
          grade: grade,
          period: parseInt(period),
          conflictingCourses: coursesInPeriod,
          message: `${grade}: ${coursesInPeriod.join(
            " and "
          )} both scheduled for Period ${period}`,
        });
      }
    });
  });
  console.log("conflicts:", conflicts);
  return conflicts;
};

const semesterToGrade = (year, semester) => {
  const currentYear = 2025;
  const yearDiff = currentYear - parseInt(year);
  if (
    semester.toLowerCase() === "fall" ||
    semester.toLowerCase() === "spring"
  ) {
    if (yearDiff === 0) return "12th Grade";
    if (yearDiff === 1) return "11th Grade";
    if (yearDiff === 2) return "10th Grade";
    if (yearDiff === 3) return "9th Grade";
  }
  return "12th Grade";
};

export default function FourYearPlanner() {
  const [plans, setPlans] = useState([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [newCourse, setNewCourse] = useState({
    year: "9th Grade",
    name: "",
    credits: 1,
    course_id: 0,
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");

  // WebSocket vars
  const { socket, isConnected } = useWebSocket(true);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);

  // Conflict vars
  const [conflicts, setConflicts] = useState([]);

  const [courses, setCourses] = useState({});
  const [viewers, setViewers] = useState([]);

  // WebSocket conflict resolution
  const [lastSavedPlans, setLastSavedPlans] = useState(plans);
  const [pendingUpdates, setPendingUpdates] = useState(new Map()); // planId -> update data

  const activeHasUnsavedChanges = useMemo(() => {
    if (plans.length === 0 || activePlanIndex >= plans.length) return false;

    const currentPlan = plans[activePlanIndex];
    const savedPlan = lastSavedPlans[activePlanIndex];

    return JSON.stringify(currentPlan) !== JSON.stringify(savedPlan);
  }, [plans, lastSavedPlans, activePlanIndex]);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const handleConflicts = () => {
    const c = conflictDetection(plans[activePlanIndex]);
    setConflicts(c);
  };

  useEffect(() => {
    fetch(`${backendUrl}/api/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    fetch(`${backendUrl}/api/classes`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        console.log("returned from api/classes:", data);
        let cs = new Map();
        for (let course of data) {
          cs.set(course.name, course);
        }
        setCourses(cs);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");

    setUsername(counselorMode ? "Counselor" : "Student");

    if (socket && isConnected) {
      const roomData = {
        type: "join-student-room",
        data: {
          studentId: studentId,
          userId: counselorMode ? "counselor@example.com" : studentId,
          userType: counselorMode ? "counselor" : "student",
        },
      };
      socket.send(JSON.stringify(roomData));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `You joined room for student: ${studentId}`,
          sender: "System",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "chat-message":
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.message || event.data,
                sender: data.sender || "Server",
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            break;
          case "plans-update":
            if (data.sender !== username) {
              console.log("activePlanIndex:", activePlanIndex);
              console.log("actual length:", data.plans.length);
              // setActivePlanIndex((prev) => data.plans.length - 1);
              setPlans(data.plans);
              // const { planIndex, planData, updatedBy } = data;

              // if (planIndex === activePlanIndex && activeHasUnsavedChanges) {
              //   // Active plan + unsaved changes = queue the update
              //   setPendingUpdates((prev) =>
              //     new Map(prev).set(planIndex, { planData, updatedBy })
              //   );

              //   // Show notification for active plan only
              //   showUpdateNotification(updatedBy, planData.name);
              // } else {
              //   // Safe to update immediately:
              //   // - It's a background plan (user can't see it), OR
              //   // - It's the active plan but user has no unsaved changes
              //   setPlans((prevPlans) => {
              //     const newPlans = [...prevPlans];
              //     newPlans[planIndex] = planData;
              //     return newPlans;
              //   });

              //   setLastSavedPlans((prevSaved) => {
              //     const newSaved = [...prevSaved];
              //     newSaved[planIndex] = planData;
              //     return newSaved;
              //   });
              // }
            }
            break;
          case "comments-update":
            if (data.sender !== username) {
              setComments(data.comments);
            }
            break;
          case "presence-update":
            console.log("data:", data);
            setViewers(data.users || []);
            break;
          default:
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.message || event.data,
                sender: data.sender || "Server",
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: event.data,
            sender: "Server",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!socket || !isConnected || !inputMessage.trim()) return;

    const messageData = {
      type: "chat-message",
      message: inputMessage,
      sender: username,
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify(messageData));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: inputMessage,
        sender: `${username} (me)`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setInputMessage("");
  };

  const sendPlansUpdate = (updatedPlans) => {
    if (!socket || !isConnected) return;
    console.log("sending message: ",updatedPlans);
    const messageData = {
      type: "plans-update",
      plans: updatedPlans,
      sender: username,
    };
    socket.send(JSON.stringify(messageData));
  };

  const sendCommentsUpdate = (updatedComments) => {
    if (!socket || !isConnected) return;
    const messageData = {
      type: "comments-update",
      comments: updatedComments,
      sender: username,
    };
    socket.send(JSON.stringify(messageData));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");
    const endpoint = counselorMode ? "admin/plans" : "plans";
    const end = counselorMode ? `/${studentId}` : "";

    fetch(`${backendUrl}/api/${endpoint}${end}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch plans");
        return res.json();
      })
      .then((plansData) => {
        if (plansData.length === 0) {
          setPlans([]);
          sendPlansUpdate(plans);
          return;
        }
        console.log("plans data:", plansData);
        Promise.all(
          plansData.map((plan) =>
            fetch(`${backendUrl}/api/plans/${plan.id}`, {
              credentials: "include",
            })
              .then((r) => r.json())
              .then((courses) => {
                const yearsGrouped = {
                  "9th Grade": [],
                  "10th Grade": [],
                  "11th Grade": [],
                  "12th Grade": [],
                };
                courses.forEach(({ class_code, year }) => {
                  if (yearsGrouped[year]) {
                    yearsGrouped[year].push(class_code);
                  } else {
                    yearsGrouped["9th Grade"].push(class_code);
                  }
                });
                return { ...plan, years: yearsGrouped };
              })
          )
        ).then((plansWithCourses) => {
          setPlans(plansWithCourses);
          console.log("plans:", plansWithCourses);
          sendPlansUpdate(plansWithCourses);

          plansWithCourses.forEach((plan) => {
            fetch(`${backendUrl}/api/plans/${plan.id}/comments`, {
              credentials: "include",
            })
              .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch comments");
                return res.json();
              })
              .then((commentsData) => {
                setComments((prev) => ({ ...prev, [plan.id]: commentsData }));
                sendCommentsUpdate(comments);
              })
              .catch(() => {
                setComments((prev) => ({ ...prev, [plan.id]: [] }));
              });
          });
        });
      })
      .catch(console.error);
  }, []);

  const fetchComments = (planId) => {
    fetch(`${backendUrl}/api/plans/${planId}/comments`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setComments((prev) => ({ ...prev, [planId]: data }));
        sendCommentsUpdate({ ...comments, [planId]: data }); // Send the updated comments
      });
  };

  const handleAddComment = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !newComment.trim()) return;

    fetch(`${backendUrl}/api/plans/${planId}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment.trim() }),
    })
      .then((res) => {
        console.log("new comment:", newComment);
        if (!res.ok) throw new Error("Failed to post comment");
        setNewComment("");
        fetchComments(planId);
      })
      .catch(console.error);
  };

  const handleAddCourse = () => {
    if (!newCourse.name.trim()) return;
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].years[newCourse.year].push(
      newCourse.name.trim()
    );
    setPlans(updatedPlans);
    sendPlansUpdate(updatedPlans);
    setNewCourse({ ...newCourse, name: "" });
  };

  const flattenCourses = (yearsObj) => {
    const cs = [];
    for (const [year, classes] of Object.entries(yearsObj)) {
      console.log("classes:", classes);
      classes.forEach((class_code) => {
        const course_id = courses.get(class_code).id;
        cs.push({
          course_id,
          class_code,
          year,
        });
      });
    }
    console.log("flattened courses:", cs);
    return cs;
  };

  const handleSaveCourses = () => {
    const activePlan = plans[activePlanIndex];
    const coursesFlat = flattenCourses(activePlan.years);
    console.log("flattened courses in hook:", coursesFlat);

    if (!activePlan.id) {
      const urlParams = new URLSearchParams(window.location.search);
      const counselorMode = urlParams.get("counselorMode") === "true";
      const studentId = urlParams.get("studentId");
      const endpoint = counselorMode ? "admin/" : "";
      const end = counselorMode ? `/${studentId}` : "";
      fetch(`${backendUrl}/api/${endpoint}plans${end}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: activePlan.name, courses: coursesFlat }),
      })
        .then((res) => res.json())
        .then(({ planId }) => {
          const updatedPlans = [...plans];
          updatedPlans[activePlanIndex].id = planId;
          setPlans(updatedPlans);
          sendPlansUpdate(updatedPlans);
          alert("Plan created successfully");
        })
        .catch(console.error);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const counselorMode = urlParams.get("counselorMode") === "true";
      const studentId = urlParams.get("studentId");
      const endpoint = counselorMode ? "admin/" : "";
      const end = counselorMode ? `/${studentId}` : "";
      fetch(
        `${backendUrl}/api/${endpoint}plans/${activePlan.id}/courses${end}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courses: coursesFlat, name: activePlan.name }),
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update plan courses");
          alert("Courses updated successfully");
        })
        .catch((err) => {
          alert(err.message);
        });
    }
  };

  const handleDeletePlan = () => {
    const activePlan = plans[activePlanIndex];
    if (!activePlan.id) {
      alert("Plan not saved yet");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");
    const endpoint = counselorMode ? "admin/" : "";
    const end = counselorMode ? `/${studentId}` : "";
    fetch(`${backendUrl}/api/${endpoint}plans/${activePlan.id}${end}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete plan");
        const updatedPlans = plans.filter((_, i) => i !== activePlanIndex);
        setPlans(updatedPlans);
        sendPlansUpdate(updatedPlans);
        setActivePlanIndex(Math.max(0, activePlanIndex - 1));
        alert("Plan deleted");
      })
      .catch(console.error);
  };

  const handleNameChange = (e) => {
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].name = e.target.value;
    setPlans((oldPlans) =>
      oldPlans.map((plan, idx) =>
        idx === activePlanIndex ? { ...plan, name: e.target.value } : plan
      )
    );
    sendPlansUpdate(updatedPlans);
  };

  const handleCourseRemove = React.useCallback(
    (year, idx) => {
      const updatedPlans = [...plans];
      updatedPlans[activePlanIndex].years[year].splice(idx, 1);
      setPlans(updatedPlans);
      sendPlansUpdate(updatedPlans);
    },
    [plans, activePlanIndex]
  );

  const handleAddPlan = React.useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");
    const endpoint = counselorMode ? "admin/" : "";
    const end = counselorMode ? `/${studentId}` : "";

    try {
      const response = await fetch(`${backendUrl}/api/${endpoint}plans${end}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", courses: [] }),
      });

      const { planId } = await response.json();

      const newPlan = {
        id: planId,
        name: "",
        years: {
          "9th Grade": [],
          "10th Grade": [],
          "11th Grade": [],
          "12th Grade": [],
        },
      };

      setPlans((prev) => {
        const updatedPlans = [...prev, newPlan];
        sendPlansUpdate(updatedPlans);
        return updatedPlans;
      });

      // setActivePlanIndex((prev) => prev + 1);
      // alert("Plan created successfully");
    } catch (error) {
      console.error("Failed to create plan:", error);
      alert("Failed to create plan. Please try again.");
    }
  }, []);

  const renderComments = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !comments[planId])
      return (
        <Typography
          sx={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          No comments yet.
        </Typography>
      );

    const planComments = comments[planId];
    if (planComments.length === 0)
      return (
        <Typography
          sx={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          No comments yet.
        </Typography>
      );

    return (
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          maxHeight: 240,
          overflowY: "auto",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: "12px",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(148, 163, 184, 0.3)",
            borderRadius: "3px",
            "&:hover": {
              background: "rgba(148, 163, 184, 0.5)",
            },
          },
        }}
      >
        {planComments
          .slice()
          .reverse()
          .map((comment, index) => (
            <li
              key={comment.id}
              style={{
                padding: "16px 20px",
                borderBottom:
                  index < planComments.length - 1
                    ? "1px solid rgba(148, 163, 184, 0.1)"
                    : "none",
                transition: "all 0.2s ease-out",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "600",
                  color: "#60a5fa",
                  mb: 0.5,
                  fontSize: "0.875rem",
                }}
              >
                {comment.author}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-word",
                  color: "#ffffff",
                  lineHeight: 1.5,
                  mb: 1,
                }}
              >
                {comment.text}
              </Typography>
              {comment.created_at && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    fontWeight: "400",
                  }}
                >
                  {new Date(comment.created_at).toLocaleString()}
                </Typography>
              )}
            </li>
          ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        px: 2,
        py: 4,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Paper
        sx={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          marginTop: 10,
          zIndex: 100,
          color: "white",
          width: 300,
          borderRadius: "16px",
          padding: 2,
          "&::before": {
            content: '""',
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            borderRadius: "16px 16px 0 0",
          },
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontWeight: 600,
            fontSize: "1.25rem",
            color: "rgba(59, 130, 246, 0.9)", // subtle blue accent to match gradient
            textAlign: "center",
            userSelect: "none",
          }}
        >
          Current Viewers
        </h3>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {viewers.map((item, i) => (
            <li
              key={i}
              style={{
                padding: "6px 0",
                borderBottom:
                  i !== viewers.length - 1
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </Paper>

      {/* <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', marginTop: "50px" }}>
        <h1>WebSocket Chat Test</h1>

        <div style={{ marginBottom: '20px' }}>
          <strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          <br />
          <strong>You are:</strong> {username}
          <br />
          <strong>Room:</strong> {new URLSearchParams(window.location.search).get('studentId') || 'jasminexu999@gmail.com'}
        </div>

        <div style={{
          border: '1px solid #ccc',
          height: '400px',
          overflowY: 'scroll',
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#f9f9f9',
          color: 'black'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666' }}>No messages yet. Start typing to test!</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '10px' }}>
                <strong>{msg.sender}</strong>
                <span style={{ color: '#666', fontSize: '12px', marginLeft: '10px' }}>
                  {msg.timestamp}
                </span>
                <br />
                <span>{msg.text}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isConnected ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send
          </button>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={() => {
            if (socket && isConnected) {
              socket.send(JSON.stringify({ type: 'test', data: 'Hello from frontend!' }));
            }
          }}>
            Send Test Message
          </button>

          <button onClick={() => {
            if (socket && isConnected) {
              socket.send('Raw string message');
            }
          }}>
            Send Raw String
          </button>
        </div>
      </div> */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 900,
          margin: "auto",
          mt: 2,
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            borderRadius: "20px 20px 0 0",
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "600",
            color: "#ffffff",
            fontSize: "1.75rem",
            letterSpacing: "-0.025em",
            mb: 3,
          }}
        >
          Class Planner
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "rgba(148, 163, 184, 0.2)" }}>
          <PlanTabs
            plans={plans}
            activePlanIndex={activePlanIndex}
            setActivePlanIndex={setActivePlanIndex}
            handleAddPlan={handleAddPlan}
          />
        </Box>

        {plans.length === 0 ? (
          <Typography sx={{ mt: 3, color: "#cbd5e1" }}>
            No plans found. Create one!
          </Typography>
        ) : (
          <>
            <Box sx={{ mt: 3 }}>
              <TextField
                label="Plan Name"
                value={plans[activePlanIndex].name}
                onChange={handleNameChange}
                size="small"
                sx={{
                  mb: 3,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    "& fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#60a5fa",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#cbd5e1",
                    "&.Mui-focused": {
                      color: "#60a5fa",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#ffffff",
                  },
                }}
                placeholder="Enter a plan name"
              />

              {defaultYears.map((year) => (
                <YearCourses
                  key={year}
                  year={year}
                  courses={plans[activePlanIndex].years[year]}
                  handleCourseRemove={handleCourseRemove}
                />
              ))}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  mb: 3,
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  select
                  label="Year"
                  value={newCourse.year}
                  onChange={(e) =>
                    setNewCourse((prev) => ({ ...prev, year: e.target.value }))
                  }
                  size="small"
                  sx={{
                    minWidth: 140,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiSelect-select": {
                      color: "#ffffff",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#cbd5e1",
                    },
                  }}
                >
                  {defaultYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>

                <Autocomplete
                  freeSolo
                  options={[...courses.keys()]}
                  value={newCourse.name}
                  onChange={(event, newValue) => {
                    setNewCourse((prev) => ({ ...prev, name: newValue || "" }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    setNewCourse((prev) => ({ ...prev, name: newInputValue }));
                  }}
                  size="small"
                  sx={{
                    flexGrow: 1,
                    minWidth: 200,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#ffffff",
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Course Name" />
                  )}
                />

                <Button
                  variant="outlined"
                  onClick={handleAddCourse}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    color: "#60a5fa",
                    borderColor: "rgba(96, 165, 250, 0.3)",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                    },
                  }}
                >
                  Add Course
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveCourses}
                  size="small"
                  sx={{
                    background:
                      "linear-gradient(135deg, #4285F4 0%, #357ae8 100%)",
                    textTransform: "none",
                    fontWeight: "500",
                    borderRadius: "8px",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #357ae8 0%, #2563eb 100%)",
                    },
                  }}
                >
                  Save Plan
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeletePlan}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    borderRadius: "8px",
                    color: "#f87171",
                    borderColor: "rgba(248, 113, 113, 0.3)",
                    "&:hover": {
                      borderColor: "#f87171",
                      backgroundColor: "rgba(248, 113, 113, 0.1)",
                    },
                  }}
                >
                  Delete Plan
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleConflicts}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    borderRadius: "8px",
                    color: "white",
                    borderColor: "white",
                    "&:hover": {
                      backgroundColor: "rgba(248, 113, 113, 0.1)",
                    },
                  }}
                >
                  Find Conflicts
                </Button>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "#ffffff",
                    fontWeight: "600",
                    mb: 3,
                  }}
                >
                  Conflicts
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    p: 3,
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  {conflicts.length === 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        py: 2,
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          fontSize: 48,
                          color: "success.main",
                          mb: 2,
                          opacity: 0.8,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          color: "success.light",
                          fontWeight: 500,
                          mb: 1,
                        }}
                      >
                        All clear!
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.7)",
                        }}
                      >
                        No conflicts detected in this schedule
                      </Typography>
                    </Box>
                  )}

                  {conflicts.length > 0 && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                          pb: 1,
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <WarningIcon
                          sx={{
                            fontSize: 24,
                            color: "warning.main",
                            mr: 1,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            color: "warning.light",
                            fontWeight: 500,
                          }}
                        >
                          {conflicts.length} Conflict
                          {conflicts.length > 1 ? "s" : ""} Found
                        </Typography>
                      </Box>

                      <List sx={{ p: 0 }}>
                        {conflicts.map((item, i) => (
                          <ListItem
                            key={i}
                            sx={{
                              backgroundColor: "rgba(255, 193, 7, 0.1)",
                              border: "1px solid rgba(255, 193, 7, 0.2)",
                              borderRadius: 1,
                              mb: 1,
                              p: 2,
                              "&:last-child": { mb: 0 },
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor: "rgba(255, 193, 7, 0.15)",
                                transform: "translateX(4px)",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <ErrorOutlineIcon
                                sx={{
                                  color: "warning.main",
                                  fontSize: 20,
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.message}
                              sx={{
                                "& .MuiListItemText-primary": {
                                  color: "rgba(255, 255, 255, 0.9)",
                                  fontSize: "0.95rem",
                                  lineHeight: 1.4,
                                },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "#ffffff",
                    fontWeight: "600",
                    mb: 3,
                  }}
                >
                  Comments
                </Typography>
                {renderComments()}
                <TextField
                  label="Add Comment"
                  multiline
                  fullWidth
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    mt: 2,
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#ffffff",
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    color: "#60a5fa",
                    borderColor: "rgba(96, 165, 250, 0.3)",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                    },
                    "&:disabled": {
                      color: "#64748b",
                      borderColor: "rgba(100, 116, 139, 0.3)",
                    },
                  }}
                >
                  Post Comment
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
